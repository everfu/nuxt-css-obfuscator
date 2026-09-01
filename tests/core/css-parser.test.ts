import { describe, it, expect, beforeEach } from 'vitest';
import { CSSParser } from '../../src/core/css-parser';
import type { Options } from '../../src/types';
import { DEFAULT_OPTIONS } from '../../src/utils/config';

describe('CSSParser', () => {
  let parser: CSSParser;
  let options: Required<Options>;

  beforeEach(() => {
    options = {
      ...DEFAULT_OPTIONS,
      mode: 'simplify',
      generatorSeed: 12345,
      removeOriginalCss: true,
    };
    parser = new CSSParser(options);
  });

  describe('Class Selector Obfuscation', () => {
    it('should obfuscate simple class selectors', () => {
      const css = '.container { color: red; }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('.container');
      expect(result).toMatch(/\.\w+\s*\{\s*color:\s*red/);
    });

    it('should obfuscate multiple class selectors', () => {
      const css = '.header { color: blue; } .footer { color: green; }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('.header');
      expect(result).not.toContain('.footer');
    });

    it('should obfuscate nested class selectors', () => {
      const css = '.parent .child { margin: 10px; }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('.parent');
      expect(result).not.toContain('.child');
    });

    it('should handle multiple classes on same element', () => {
      const css = '.btn.primary { background: blue; }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('.btn');
      expect(result).not.toContain('.primary');
    });
  });

  describe('ID Selector Obfuscation', () => {
    it('should obfuscate ID selectors', () => {
      const css = '#header { height: 100px; }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('#header');
      expect(result).toMatch(/#\w+\s*\{\s*height:\s*100px/);
    });

    it('should obfuscate multiple ID selectors', () => {
      const css = '#nav { width: 200px; } #footer { height: 50px; }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('#nav');
      expect(result).not.toContain('#footer');
    });
  });

  describe('Animation Name Obfuscation', () => {
    it('should obfuscate @keyframes names', () => {
      const css = '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('fadeIn');
      expect(result).toMatch(/@keyframes\s+\w+/);
    });

    it('should obfuscate animation property references', () => {
      const css = `
        @keyframes slideIn { from { left: 0; } }
        .animated { animation: slideIn 1s; }
      `;
      const result = parser.parseCss(css);
      
      const animationName = parser.getIdentMap().slideIn;
      expect(result).toContain(`@keyframes ${animationName}`);
      expect(result).toContain(`animation:${animationName} 1s`);
      expect(result).not.toContain('slideIn');
    });
  });

  describe('Ignore Patterns', () => {
    it('should ignore specified class names', () => {
      const customOptions: Required<Options> = {
        ...DEFAULT_OPTIONS,
        removeOriginalCss: true,
        ignorePatterns: {
          selectors: ['container', /^btn-/],
          idents: [],
        },
      };
      const customParser = new CSSParser(customOptions);
      
      const css = '.container { width: 100%; } .btn-primary { color: blue; } .header { color: red; }';
      const result = customParser.parseCss(css);
      
      expect(result).toContain('.container');
      expect(result).toContain('.btn-primary');
      expect(result).not.toContain('.header');
    });

    it('should ignore specified ID names', () => {
      const customOptions: Required<Options> = {
        ...DEFAULT_OPTIONS,
        removeOriginalCss: true,
        ignorePatterns: {
          selectors: [],
          idents: ['app', /^main-/],
        },
      };
      const customParser = new CSSParser(customOptions);
      
      const css = '#app { height: 100vh; } #main-content { padding: 20px; } #sidebar { width: 200px; }';
      const result = customParser.parseCss(css);
      
      expect(result).toContain('#app');
      expect(result).toContain('#main-content');
      expect(result).not.toContain('#sidebar');
    });
  });

  describe('Prefix and Suffix', () => {
    it('should add prefix to obfuscated selectors', () => {
      const customOptions: Required<Options> = {
        ...DEFAULT_OPTIONS,
        removeOriginalCss: true,
        prefix: { selectors: 'x-', idents: '' },
        mode: 'simplify',
      };
      const customParser = new CSSParser(customOptions);
      
      const css = '.test { color: red; }';
      const result = customParser.parseCss(css);
      
      expect(result).toMatch(/\.x-\w+/);
    });

    it('should add suffix to obfuscated selectors', () => {
      const customOptions: Required<Options> = {
        ...DEFAULT_OPTIONS,
        removeOriginalCss: true,
        suffix: { selectors: '-x', idents: '' },
        mode: 'simplify',
      };
      const customParser = new CSSParser(customOptions);
      
      const css = '.test { color: red; }';
      const result = customParser.parseCss(css);
      
      // Check that the class was obfuscated (not 'test')
      expect(result).not.toContain('.test');
      // The suffix should be applied
      const map = customParser.getSelectorMap();
      expect(map.test).toBeDefined();
      expect(map.test).toMatch(/-x$/); // Should end with -x
    });
  });

  describe('Conversion Maps', () => {
    it('does not generate a name that is already an original selector', () => {
      const collisionParser = new CSSParser({ ...DEFAULT_OPTIONS, mode: 'simplify', removeOriginalCss: true });
      collisionParser.parseCss('.long-name, .a { color: red; }');
      expect(collisionParser.getSelectorMap()['long-name']).not.toBe('a');
    });

    it('should return selector conversion map', () => {
      const css = '.header { color: blue; } .footer { color: green; }';
      parser.parseCss(css);
      
      const map = parser.getSelectorMap();
      expect(map).toHaveProperty('header');
      expect(map).toHaveProperty('footer');
      expect(map.header).toBeTruthy();
      expect(map.footer).toBeTruthy();
    });

    it('should return ident conversion map', () => {
      const css = '#app { height: 100vh; } #main { width: 100%; }';
      parser.parseCss(css);
      
      const map = parser.getIdentMap();
      expect(map).toHaveProperty('app');
      expect(map).toHaveProperty('main');
    });

    it('should load existing maps', () => {
      const selectorMap = { test: 'abc123' };
      const identMap = { main: 'xyz789' };
      
      parser.loadMaps(selectorMap, identMap);
      
      const css = '.test { color: red; } #main { height: 100px; }';
      const result = parser.parseCss(css);
      
      expect(result).toContain('.abc123');
      expect(result).toContain('#xyz789');
    });
  });

  describe('Error Handling', () => {
    it('returns a string for recoverable CSS syntax', () => {
      const invalidCss = '.test { color: red';
      expect(parser.parseCss(invalidCss)).toEqual(expect.any(String));
    });

    it('should handle empty CSS', () => {
      const result = parser.parseCss('');
      expect(result).toBe('');
    });
  });

  describe('Complex CSS', () => {
    it('stores escaped CSS identifiers using their runtime class spelling', () => {
      parser.parseCss('.dark\\:bg-black.w-1\\/2 { color: red; }');
      const map = parser.getSelectorMap();
      expect(map).toHaveProperty('dark:bg-black');
      expect(map).toHaveProperty('w-1/2');
      expect(map).not.toHaveProperty('dark\\:bg-black');
    });

    it('should handle media queries', () => {
      const css = `
        @media (max-width: 768px) {
          .mobile { display: block; }
        }
      `;
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('.mobile');
      expect(result).toContain('@media');
    });

    it('should handle pseudo-classes', () => {
      const css = '.button:hover { background: blue; }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('.button');
      expect(result).toContain(':hover');
    });

    it('should handle pseudo-elements', () => {
      const css = '.text::before { content: "→"; }';
      const result = parser.parseCss(css);
      
      expect(result).not.toContain('.text');
      expect(result).toContain('::before');
    });
  });

  describe('Original CSS policy', () => {
    it('keeps original rules and appends obfuscated rules by default', () => {
      const css = '.container { color: red; }';
      const result = new CSSParser({ ...DEFAULT_OPTIONS, mode: 'simplify' }).parseCss(css);

      expect(result).toContain('.container { color: red; }');
      expect(result).toContain('.a{color:red}');
    });
  });
});
