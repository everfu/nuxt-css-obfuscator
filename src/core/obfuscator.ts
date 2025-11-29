import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import fg from 'fast-glob';
import type { Options, ConversionData } from '../types';
import { CSSParser } from './css-parser';
import { FileProcessor } from './file-processor';
import { logger } from '../utils/logger';

export class Obfuscator {
  private options: Required<Options>;
  private cssParser: CSSParser;
  private fileProcessor: FileProcessor;
  private conversionData: ConversionData = {
    selectors: {},
    idents: {},
  };

  constructor(options: Required<Options>) {
    this.options = options;
    this.cssParser = new CSSParser(options);
    this.fileProcessor = new FileProcessor(options);
  }

  private getConversionFilePath(): string {
    return resolve(this.options.classConversionJsonFolderPath, 'conversion.json');
  }

  private loadConversionData(): void {
    const filePath = this.getConversionFilePath();
    
    if (!this.options.refreshClassConversionJson && existsSync(filePath)) {
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        this.conversionData = data;
        this.cssParser.loadMaps(data.selectors, data.idents);
        logger.info('Loaded existing conversion data');
      } catch (error) {
        logger.warn('Failed to load conversion data, starting fresh');
      }
    }
  }

  private saveConversionData(): void {
    const filePath = this.getConversionFilePath();
    const dir = this.options.classConversionJsonFolderPath;

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.conversionData.selectors = this.cssParser.getSelectorMap();
    this.conversionData.idents = this.cssParser.getIdentMap();

    writeFileSync(filePath, JSON.stringify(this.conversionData, null, 2), 'utf-8');
    logger.info(`Saved conversion data to ${filePath}`);
  }

  private async findCssFiles(): Promise<string[]> {
    const buildPath = resolve(this.options.buildFolderPath);
    const pattern = join(buildPath, '**/*.css');
    
    return await fg(pattern, {
      ignore: ['**/node_modules/**', '**/cache/**'],
      absolute: true,
    });
  }

  private async findBuildFiles(): Promise<string[]> {
    const buildPath = resolve(this.options.buildFolderPath);
    const extensions = this.options.allowExtensions.map(ext => ext.replace('.', ''));
    const pattern = join(buildPath, `**/*.{${extensions.join(',')}}`);
    
    return await fg(pattern, {
      ignore: ['**/node_modules/**', '**/cache/**', '**/*.css'],
      absolute: true,
    });
  }

  async obfuscate(): Promise<void> {
    if (!this.options.enable) {
      logger.info('Obfuscation is disabled');
      return;
    }

    logger.info('Starting CSS obfuscation...');
    
    // Load existing conversion data if available
    this.loadConversionData();

    // Find and process CSS files
    const cssFiles = await this.findCssFiles();
    logger.info(`Found ${cssFiles.length} CSS files`);

    for (const cssFile of cssFiles) {
      try {
        const content = readFileSync(cssFile, 'utf-8');
        const obfuscated = this.cssParser.parseCss(content);
        writeFileSync(cssFile, obfuscated, 'utf-8');
        logger.debug(`Obfuscated CSS: ${cssFile}`);
      } catch (error) {
        logger.error(`Failed to obfuscate ${cssFile}:`, error);
      }
    }

    // Save conversion data
    this.saveConversionData();

    // Process build files
    const buildFiles = await this.findBuildFiles();
    logger.info(`Found ${buildFiles.length} build files to process`);

    let processedCount = 0;
    for (const file of buildFiles) {
      if (this.fileProcessor.processFile(file, this.conversionData.selectors, this.conversionData.idents)) {
        processedCount++;
      }
    }

    logger.success(`✓ Obfuscation complete! Processed ${processedCount} files`);
    logger.info(`Total selectors obfuscated: ${Object.keys(this.conversionData.selectors).length}`);
    logger.info(`Total idents obfuscated: ${Object.keys(this.conversionData.idents).length}`);
  }
}
