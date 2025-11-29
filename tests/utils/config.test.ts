import { describe, it, expect } from 'vitest';
import { mergeConfig, DEFAULT_OPTIONS } from '../../src/utils/config';
import type { Options } from '../../src/types';

describe('Config Utils', () => {
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
});
