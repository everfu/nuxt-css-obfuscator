import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { brotliDecompressSync, gunzipSync } from 'zlib';
import { Obfuscator } from '../../src/core/obfuscator';
import { DEFAULT_OPTIONS } from '../../src/utils/config';

describe('Obfuscator pipeline', () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  function fixture() {
    const root = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-pipeline-'));
    temporaryDirectories.push(root);
    mkdirSync(join(root, '.output'), { recursive: true });
    return root;
  }

  it('stages all transformations and leaves output untouched when script parsing fails', async () => {
    const root = fixture();
    const cssPath = join(root, '.output', 'app.css');
    const scriptPath = join(root, '.output', 'app.js');
    writeFileSync(cssPath, '.card { color: red }');
    writeFileSync(scriptPath, 'const broken = { class: "card" ');
    const obfuscator = new Obfuscator({
      ...DEFAULT_OPTIONS,
      mode: 'simplify',
      removeOriginalCss: true,
      refreshClassConversionJson: true,
      logLevel: 'silent',
    }, root);

    await expect(obfuscator.obfuscate()).rejects.toThrow();
    expect(readFileSync(cssPath, 'utf-8')).toBe('.card { color: red }');
    expect(readFileSync(scriptPath, 'utf-8')).toBe('const broken = { class: "card" ');
    expect(existsSync(join(root, 'css-obfuscator', 'conversion.json'))).toBe(false);
  });

  it('reserves restored names so new mappings cannot collide', async () => {
    const root = fixture();
    mkdirSync(join(root, 'css-obfuscator'));
    writeFileSync(join(root, 'css-obfuscator', 'conversion.json'), JSON.stringify({ selectors: { old: 'a' }, idents: {} }));
    writeFileSync(join(root, '.output', 'app.css'), '.new { color: red }');
    writeFileSync(join(root, '.output', 'index.html'), '<div class="new"></div>');
    await new Obfuscator({
      ...DEFAULT_OPTIONS,
      mode: 'simplify',
      removeOriginalCss: true,
      allowExtensions: ['.html'],
      logLevel: 'silent',
    }, root).obfuscate();

    const conversion = JSON.parse(readFileSync(join(root, 'css-obfuscator', 'conversion.json'), 'utf-8'));
    expect(conversion.selectors.old).toBe('a');
    expect(conversion.selectors.new).toBe('b');
  });

  it('rejects CLI marker mode when script output makes the subtree ambiguous', async () => {
    const root = fixture();
    writeFileSync(join(root, '.output', 'app.css'), '.card { color: red }');
    writeFileSync(join(root, '.output', 'app.mjs'), 'export default { class: "card" }');
    await expect(new Obfuscator({
      ...DEFAULT_OPTIONS,
      enableMarkers: true,
      allowExtensions: ['.mjs'],
      logLevel: 'silent',
    }, root, { executionMode: 'cli' }).obfuscate()).rejects.toThrow(/CLI marker mode only supports/);
  });

  it('refreshes compressed assets and Nitro metadata when the CLI changes a complete output', async () => {
    const root = fixture();
    const publicRoot = join(root, '.output', 'public');
    const serverRoot = join(root, '.output', 'server', 'chunks', 'nitro');
    mkdirSync(publicRoot, { recursive: true });
    mkdirSync(serverRoot, { recursive: true });
    const cssPath = join(publicRoot, 'app.css');
    writeFileSync(cssPath, '.card { color: red }');
    writeFileSync(`${cssPath}.gz`, 'stale gzip');
    writeFileSync(`${cssPath}.br`, 'stale brotli');
    const manifestPath = join(serverRoot, 'nitro.mjs');
    writeFileSync(manifestPath, `const assets={"/app.css":{type:"text/css",encoding:null,etag:'"old"',mtime:"old",size:20,path:"../public/app.css"},"/app.css.gz":{type:"text/css",encoding:"gzip",etag:'"old"',mtime:"old",size:10,path:"../public/app.css.gz"},"/app.css.br":{type:"text/css",encoding:"br",etag:'"old"',mtime:"old",size:12,path:"../public/app.css.br"}};`);

    await new Obfuscator({
      ...DEFAULT_OPTIONS,
      mode: 'simplify',
      removeOriginalCss: true,
      allowExtensions: ['.html'],
      refreshClassConversionJson: true,
      logLevel: 'silent',
    }, root, { executionMode: 'cli' }).obfuscate();

    const css = readFileSync(cssPath, 'utf-8');
    const manifest = readFileSync(manifestPath, 'utf-8');
    const digest = createHash('sha1').update(css).digest('base64').replace(/=+$/, '');
    const etag = `"${Buffer.byteLength(css).toString(16)}-${digest}"`;
    expect(css).toContain('.a');
    expect(gunzipSync(readFileSync(`${cssPath}.gz`)).toString()).toBe(css);
    expect(brotliDecompressSync(readFileSync(`${cssPath}.br`)).toString()).toBe(css);
    expect(manifest).toContain(`size:${Buffer.byteLength(css)}`);
    expect(manifest).toContain(`etag:${JSON.stringify(etag)}`);
  });

  it('leaves Nitro output untouched when changed CLI assets are absent from its manifest', async () => {
    const root = fixture();
    const publicRoot = join(root, '.output', 'public');
    const serverRoot = join(root, '.output', 'server', 'chunks', 'nitro');
    mkdirSync(publicRoot, { recursive: true });
    mkdirSync(serverRoot, { recursive: true });
    const cssPath = join(publicRoot, 'app.css');
    const manifestPath = join(serverRoot, 'nitro.mjs');
    writeFileSync(cssPath, '.card { color: red }');
    writeFileSync(manifestPath, 'const assets={};');

    await expect(new Obfuscator({
      ...DEFAULT_OPTIONS,
      mode: 'simplify',
      removeOriginalCss: true,
      allowExtensions: ['.html'],
      refreshClassConversionJson: true,
      logLevel: 'silent',
    }, root, { executionMode: 'cli' }).obfuscate()).rejects.toThrow(/updated 0 of 1 changed Nitro asset manifest entries/);

    expect(readFileSync(cssPath, 'utf-8')).toBe('.card { color: red }');
    expect(readFileSync(manifestPath, 'utf-8')).toBe('const assets={};');
    expect(existsSync(join(root, 'css-obfuscator', 'conversion.json'))).toBe(false);
  });
});
