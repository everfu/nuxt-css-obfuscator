import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { brotliCompressSync, gzipSync } from 'zlib';
import { dirname, extname, join, relative, resolve, sep } from 'path';
import fg from 'fast-glob';
import type { ConversionData, Options } from '../types';
import { CSSParser } from './css-parser';
import { FileProcessor } from './file-processor';
import { logger } from '../utils/logger';

interface ObfuscatorContext {
  executionMode?: 'cli' | 'module';
}

interface StagedFile {
  path: string;
  content: string | Buffer;
}

export interface ObfuscationResult {
  changedFiles: string[];
  skipped: boolean;
}

export class Obfuscator {
  private cssParser: CSSParser;
  private fileProcessor: FileProcessor;
  private prepared = false;
  private running = false;
  private completedPaths = new Set<string>();
  private executionMode: 'cli' | 'module';
  private buildPath: string;
  private conversionFolder: string;

  constructor(private options: Required<Options>, private rootDir = process.cwd(), context: ObfuscatorContext = {}) {
    this.executionMode = context.executionMode || 'cli';
    this.buildPath = resolve(rootDir, options.buildFolderPath);
    this.conversionFolder = resolve(rootDir, options.classConversionJsonFolderPath);
    this.cssParser = new CSSParser(options);
    this.fileProcessor = new FileProcessor(options, rootDir);
  }

  getParser(): CSSParser {
    return this.cssParser;
  }

  getFileProcessor(): FileProcessor {
    return this.fileProcessor;
  }

  setBuildFolderPath(path: string): void {
    if (this.running) throw new Error('Cannot change the build folder while obfuscation is running');
    this.buildPath = resolve(this.rootDir, path);
  }

  refreshCompressedFiles(changedFiles: string[]): void {
    for (const filePath of changedFiles) {
      const content = readFileSync(filePath);
      if (existsSync(`${filePath}.gz`)) writeFileSync(`${filePath}.gz`, gzipSync(content));
      if (existsSync(`${filePath}.br`)) writeFileSync(`${filePath}.br`, brotliCompressSync(content));
    }
  }

  private getConversionFilePath(): string {
    return join(this.conversionFolder, 'conversion.json');
  }

  prepare(): void {
    if (this.prepared) return;
    const filePath = this.getConversionFilePath();
    if (!this.options.refreshClassConversionJson && existsSync(filePath)) {
      let data: ConversionData;
      try {
        data = JSON.parse(readFileSync(filePath, 'utf-8')) as ConversionData;
      } catch (error) {
        throw new Error(`Failed to load conversion data from ${filePath}: ${String(error)}`);
      }
      if (!data || typeof data.selectors !== 'object' || typeof data.idents !== 'object') {
        throw new Error(`Invalid conversion data in ${filePath}`);
      }
      this.cssParser.loadMaps(data.selectors, data.idents);
      logger.info(`Loaded conversion data from ${filePath}`);
    }
    this.prepared = true;
  }

  private async findCssFiles(): Promise<string[]> {
    const files = await fg('**/*.css', {
      cwd: this.buildPath,
      ignore: ['**/node_modules/**', '**/cache/**'],
      absolute: true,
      onlyFiles: true,
    });
    return files.filter((file) => this.fileProcessor.isPathAllowed(file)).sort();
  }

  private async findBuildFiles(): Promise<string[]> {
    const extensions = this.options.allowExtensions.map((extension) => extension.replace(/^\./, ''));
    if (!extensions.length) return [];
    const patterns = extensions.map((extension) => `**/*.${extension}`);
    const files = await fg(patterns, {
      cwd: this.buildPath,
      ignore: ['**/node_modules/**', '**/cache/**', '**/*.css'],
      absolute: true,
      onlyFiles: true,
    });
    return files.filter((file) => this.fileProcessor.shouldProcessFile(file)).sort();
  }

  private validate(staged: StagedFile[], conversionData: ConversionData): void {
    const textFiles = staged.filter((file): file is StagedFile & { content: string } => typeof file.content === 'string');
    const byPath = new Map(textFiles.map((file) => [file.path, file.content]));
    for (const file of textFiles) {
      if (extname(file.path) === '.css') continue;
      const secondPass = this.fileProcessor.transformContent(file.content, file.path, conversionData.selectors, conversionData.idents);
      if (!this.options.enableMarkers && secondPass.changed) {
        throw new Error(`Consistency validation failed: unresolved obfuscation references remain in ${file.path}`);
      }
    }
    const stagedCss = textFiles.filter((file) => extname(file.path) === '.css');
    if (this.options.removeOriginalCss && stagedCss.length > 0) {
      const css = stagedCss.map((file) => file.content).join('\n');
      for (const original of this.cssParser.getActiveSelectorNames()) {
        const mapped = conversionData.selectors[original];
        if (!css.includes(`.${mapped}`)) throw new Error(`Consistency validation failed: mapped selector .${mapped} is absent from CSS output`);
      }
      for (const path of byPath.keys()) {
        if (!existsSync(dirname(path))) throw new Error(`Output directory disappeared during obfuscation: ${dirname(path)}`);
      }
    }
  }

  private replaceNitroAssetMetadata(manifest: string, publicRoot: string, file: StagedFile, timestamp: string): string {
    const relativePath = relative(publicRoot, file.path).split(sep).join('/');
    const key = JSON.stringify(`/${relativePath}`);
    const start = manifest.indexOf(`${key}:{`);
    if (start === -1) {
      throw new Error(`Consistency validation failed: Nitro asset manifest is missing /${relativePath}`);
    }
    const end = manifest.indexOf('}', start);
    if (end === -1) throw new Error(`Invalid Nitro asset manifest entry for /${relativePath}`);
    const bytes = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content);
    const digest = createHash('sha1').update(bytes).digest('base64').replace(/=+$/, '');
    const etag = `"${bytes.length.toString(16)}-${digest}"`;
    const original = manifest.slice(start, end + 1);
    const updated = original
      .replace(/etag:(?:'[^']*'|"[^"]*")/, `etag:${JSON.stringify(etag)}`)
      .replace(/mtime:"[^"]*"/, `mtime:${JSON.stringify(timestamp)}`)
      .replace(/size:\d+/, `size:${bytes.length}`);
    if (updated === original || !updated.includes(`size:${bytes.length}`)) {
      throw new Error(`Invalid Nitro asset metadata for /${relativePath}`);
    }
    return `${manifest.slice(0, start)}${updated}${manifest.slice(end + 1)}`;
  }

  private async stageCliNitroMetadata(staged: StagedFile[]): Promise<void> {
    if (this.executionMode !== 'cli') return;
    const publicRoot = join(this.buildPath, 'public');
    const serverRoot = join(this.buildPath, 'server');
    if (!existsSync(publicRoot) || !existsSync(serverRoot)) return;

    const publicPrefix = `${publicRoot}${sep}`;
    const changedPublicFiles = staged.filter((file) => file.path.startsWith(publicPrefix) && !file.path.endsWith('.gz') && !file.path.endsWith('.br'));
    if (changedPublicFiles.length === 0) return;

    const assetFiles = [...changedPublicFiles];
    for (const file of changedPublicFiles) {
      const bytes = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content);
      if (existsSync(`${file.path}.gz`)) assetFiles.push({ path: `${file.path}.gz`, content: gzipSync(bytes) });
      if (existsSync(`${file.path}.br`)) assetFiles.push({ path: `${file.path}.br`, content: brotliCompressSync(bytes) });
    }

    const manifestPaths = (await fg('**/nitro/*.mjs', { cwd: serverRoot, absolute: true, onlyFiles: true })).sort();
    if (manifestPaths.length === 0) {
      throw new Error(`Consistency validation failed: Nitro server output exists but its asset manifest was not found in ${serverRoot}`);
    }
    const timestamp = new Date().toISOString();
    const updatedAssets = new Set<string>();
    for (const manifestPath of manifestPaths) {
      const existing = staged.find((file) => file.path === manifestPath);
      let content = existing && typeof existing.content === 'string' ? existing.content : readFileSync(manifestPath, 'utf-8');
      let changed = false;
      for (const asset of assetFiles) {
        const key = JSON.stringify(`/${relative(publicRoot, asset.path).split(sep).join('/')}`);
        if (!content.includes(`${key}:{`)) continue;
        content = this.replaceNitroAssetMetadata(content, publicRoot, asset, timestamp);
        changed = true;
        updatedAssets.add(asset.path);
      }
      if (changed) {
        if (existing) existing.content = content;
        else staged.push({ path: manifestPath, content });
      }
    }
    if (updatedAssets.size !== assetFiles.length) {
      throw new Error(`Consistency validation failed: updated ${updatedAssets.size} of ${assetFiles.length} changed Nitro asset manifest entries`);
    }
    staged.push(...assetFiles.filter((file) => file.path.endsWith('.gz') || file.path.endsWith('.br')));
  }

  private commit(staged: StagedFile[], conversionData: ConversionData): void {
    const conversionPath = this.getConversionFilePath();
    const all = [...staged, { path: conversionPath, content: `${JSON.stringify(conversionData, null, 2)}\n` }];
    const temporary: Array<{ path: string; temporaryPath: string }> = [];
    try {
      all.forEach((file, index) => {
        mkdirSync(dirname(file.path), { recursive: true });
        const temporaryPath = `${file.path}.nuxt-css-obfuscator-${process.pid}-${index}.tmp`;
        writeFileSync(temporaryPath, file.content);
        temporary.push({ path: file.path, temporaryPath });
      });
      for (const file of temporary) renameSync(file.temporaryPath, file.path);
    } catch (error) {
      for (const file of temporary) {
        if (existsSync(file.temporaryPath)) unlinkSync(file.temporaryPath);
      }
      throw error;
    }
    logger.info(`Saved conversion data to ${conversionPath}`);
  }

  async obfuscate(): Promise<ObfuscationResult> {
    if (!this.options.enable) {
      logger.info('Obfuscation is disabled');
      return { changedFiles: [], skipped: true };
    }
    if (this.completedPaths.has(this.buildPath)) {
      logger.debug('Skipping duplicate obfuscation run');
      return { changedFiles: [], skipped: true };
    }
    if (this.running) throw new Error('Obfuscation is already running');
    if (!existsSync(this.buildPath)) throw new Error(`Build output does not exist: ${this.buildPath}`);
    this.running = true;
    try {
      this.prepare();
      logger.info(`Starting CSS obfuscation in ${this.buildPath}`);
      const [cssFiles, buildFiles] = await Promise.all([this.findCssFiles(), this.findBuildFiles()]);
      logger.info(`Found ${cssFiles.length} CSS files and ${buildFiles.length} build files`);
      const source = new Map<string, string>();
      for (const path of [...cssFiles, ...buildFiles]) source.set(path, readFileSync(path, 'utf-8'));

      const markerDocuments = new Map<string, string>();
      if (this.options.enableMarkers && this.executionMode === 'cli') {
        const unsupported = buildFiles.find((file) => !['.html', '.xml', '.xsl'].includes(extname(file)));
        if (unsupported) {
          throw new Error(`CLI marker mode only supports static HTML/XML/XSL output. Found ${unsupported}; use Nuxt module mode for SSR or script output.`);
        }
        for (const file of buildFiles) {
          markerDocuments.set(file, this.fileProcessor.transformMarkedDocument(source.get(file) || '', {
            selector: (name) => this.options.markers.includes(name) ? name : this.cssParser.ensureSelector(name),
            ident: (name) => this.cssParser.ensureIdent(name),
          }));
        }
      }

      for (const file of cssFiles) this.cssParser.reserveCssNames(source.get(file) || '');
      for (const file of cssFiles) this.cssParser.collectCss(source.get(file) || '');
      const conversionData: ConversionData = {
        selectors: this.cssParser.getSelectorMap(),
        idents: this.cssParser.getIdentMap(),
      };
      const staged: StagedFile[] = [];
      let cssChangedCount = 0;
      for (const file of cssFiles) {
        const original = source.get(file) || '';
        const content = this.cssParser.parseCss(original);
        if (content !== original) {
          staged.push({ path: file, content });
          cssChangedCount++;
        }
      }

      let processedCount = 0;
      for (const file of buildFiles) {
        const original = source.get(file) || '';
        const result = markerDocuments.has(file)
          ? { content: markerDocuments.get(file)!, changed: markerDocuments.get(file)! !== original }
          : this.fileProcessor.transformContent(original, file, conversionData.selectors, conversionData.idents);
        if (result.changed) {
          staged.push({ path: file, content: result.content });
          processedCount++;
        }
      }

      this.validate(staged, conversionData);
      await this.stageCliNitroMetadata(staged);
      this.commit(staged, conversionData);
      this.completedPaths.add(this.buildPath);
      logger.success(`✓ Obfuscation complete! Changed ${processedCount} build files and ${cssChangedCount} CSS files`);
      logger.info(`Total selectors obfuscated: ${Object.keys(conversionData.selectors).length}`);
      logger.info(`Total idents obfuscated: ${Object.keys(conversionData.idents).length}`);
      return { changedFiles: staged.map((file) => file.path), skipped: false };
    } finally {
      this.running = false;
    }
  }
}
