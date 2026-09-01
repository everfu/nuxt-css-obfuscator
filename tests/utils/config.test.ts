import { afterEach, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { mergeConfig, DEFAULT_OPTIONS, loadConfig } from '../../src/utils/config';
import type { Options } from '../../src/types';

describe('Config Utils', () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  describe('mergeConfig', () => {
    it('should merge user config with defaults', () => {
      const userConfig: Options = {
        enable: false,
        mode: 'simplify',
      };

      const result = mergeConfig(DEFAULT_OPTIONS, userConfig);

      expect(result.enable).toBe(false);
      expect(result.mode).toBe('simplify');
      expect(result.classLength).toBe(DEFAULT_OPTIONS.classLength);
    });

    it('should normalize string prefix to object', () => {
      const userConfig: Options = {
        prefix: 'x-',
      };

      const result = mergeConfig(DEFAULT_OPTIONS, userConfig);

      expect(result.prefix).toEqual({
        selectors: 'x-',
        idents: 'x-',
      });
    });

    it('should normalize string suffix to object', () => {
      const userConfig: Options = {
        suffix: '-x',
      };

      const result = mergeConfig(DEFAULT_OPTIONS, userConfig);

      expect(result.suffix).toEqual({
        selectors: '-x',
        idents: '-x',
      });
    });

    it('should merge ignore patterns', () => {
      const userConfig: Options = {
        ignorePatterns: {
          selectors: ['custom'],
        },
      };

      const result = mergeConfig(DEFAULT_OPTIONS, userConfig);

      expect(result.ignorePatterns.selectors).toContain('custom');
    });

    it('should handle object prefix/suffix', () => {
      const userConfig: Options = {
        prefix: { selectors: 'sel-', idents: 'id-' },
        suffix: { selectors: '-sel', idents: '-id' },
      };

      const result = mergeConfig(DEFAULT_OPTIONS, userConfig);

      expect(result.prefix).toEqual({ selectors: 'sel-', idents: 'id-' });
      expect(result.suffix).toEqual({ selectors: '-sel', idents: '-id' });
    });

    it('should preserve all default options when user config is empty', () => {
      const result = mergeConfig(DEFAULT_OPTIONS, {});

      expect(result).toEqual(DEFAULT_OPTIONS);
    });

    it('should handle partial ignore patterns', () => {
      const userConfig: Options = {
        ignorePatterns: {
          selectors: ['test'],
        },
      };

      const result = mergeConfig(DEFAULT_OPTIONS, userConfig);

      expect(result.ignorePatterns.selectors).toContain('test');
      expect(result.ignorePatterns.idents).toBeDefined();
    });
  });

  describe('DEFAULT_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_OPTIONS.enable).toBe(true);
      expect(DEFAULT_OPTIONS.mode).toBe('random');
      expect(DEFAULT_OPTIONS.buildFolderPath).toBe('.output');
      expect(DEFAULT_OPTIONS.classConversionJsonFolderPath).toBe('./css-obfuscator');
      expect(DEFAULT_OPTIONS.refreshClassConversionJson).toBe(false);
      expect(DEFAULT_OPTIONS.classLength).toBe(5);
      expect(DEFAULT_OPTIONS.logLevel).toBe('info');
    });

    it('should have correct default extensions', () => {
      expect(DEFAULT_OPTIONS.allowExtensions).toContain('.vue');
      expect(DEFAULT_OPTIONS.allowExtensions).toContain('.js');
      expect(DEFAULT_OPTIONS.allowExtensions).toContain('.ts');
    });

    it('should have correct default markers', () => {
      expect(DEFAULT_OPTIONS.markers).toContain('nuxt-css-obfuscation');
      expect(DEFAULT_OPTIONS.enableMarkers).toBe(false);
      expect(DEFAULT_OPTIONS.removeMarkersAfterObfuscated).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it.each([
      ['config.ts', 'export default { mode: "simplify", generatorSeed: 7 }'],
      ['config.mjs', 'export default { mode: "simplify-seedable", generatorSeed: 8 }'],
      ['config.js', 'export default { mode: "simplify", generatorSeed: 10 }'],
    ])('loads %s through the explicit ESM-compatible loader', async (fileName, source) => {
      const directory = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-config-'));
      temporaryDirectories.push(directory);
      writeFileSync(join(directory, fileName), source);

      const config = await loadConfig(directory, fileName);
      expect(config.mode).toMatch(/^simplify/);
      expect(config.generatorSeed).toBeGreaterThan(0);
    });

    it('rejects an explicit CommonJS config extension', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-config-'));
      temporaryDirectories.push(directory);
      writeFileSync(join(directory, 'config.cjs'), 'module.exports = { mode: "simplify" }');

      await expect(loadConfig(directory, 'config.cjs')).rejects.toThrow(/requires an ESM/);
    });

    it('rejects an automatically discovered CommonJS config', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-config-'));
      temporaryDirectories.push(directory);
      writeFileSync(join(directory, 'nuxt-css-obfuscator.config.cjs'), 'module.exports = { mode: "simplify" }');

      await expect(loadConfig(directory)).rejects.toThrow(/requires an ESM/);
    });

    it('rejects CommonJS syntax in a .js config', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-config-'));
      temporaryDirectories.push(directory);
      writeFileSync(join(directory, 'config.js'), 'module.exports = { mode: "simplify" }');

      await expect(loadConfig(directory, 'config.js')).rejects.toThrow(/module\.exports configs are not supported/);
    });

    it('fails for a missing explicit config instead of using defaults', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-config-'));
      temporaryDirectories.push(directory);
      await expect(loadConfig(directory, 'missing.ts')).rejects.toThrow(/Config file not found/);
    });

    it('fails for an invalid existing config instead of using defaults', async () => {
      const directory = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-config-'));
      temporaryDirectories.push(directory);
      writeFileSync(join(directory, 'broken.ts'), 'export default { mode:');
      await expect(loadConfig(directory, 'broken.ts')).rejects.toThrow(/Failed to load config/);
    });

    it('rejects marker mode combined with original CSS removal', () => {
      expect(() => mergeConfig(DEFAULT_OPTIONS, { enableMarkers: true, removeOriginalCss: true }))
        .toThrow(/cannot be combined/);
    });
  });
});
