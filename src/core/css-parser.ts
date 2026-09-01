import * as csstree from 'css-tree';
import type { ClassConversionMap, Options, PrefixSuffixOptions } from '../types';
import { ClassNameGenerator } from '../utils/generator';

const ANIMATION_KEYWORDS = new Set([
  'none', 'initial', 'inherit', 'unset', 'revert', 'revert-layer',
  'infinite', 'normal', 'reverse', 'alternate', 'alternate-reverse',
  'forwards', 'backwards', 'both', 'running', 'paused', 'linear',
  'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end',
]);

export class CSSParser {
  private selectorGenerator: ClassNameGenerator;
  private identGenerator: ClassNameGenerator;
  private selectorMap: ClassConversionMap = {};
  private identMap: ClassConversionMap = {};
  private activeSelectors = new Set<string>();

  constructor(private options: Required<Options>) {
    this.selectorGenerator = new ClassNameGenerator(options.mode, options.classLength, options.generatorSeed);
    this.identGenerator = new ClassNameGenerator(options.mode, options.classLength, options.generatorSeed === undefined ? undefined : options.generatorSeed + 1);
  }

  private shouldIgnore(name: string, patterns: Array<string | RegExp>): boolean {
    return patterns.some((pattern) => {
      if (typeof pattern === 'string') return name === pattern;
      pattern.lastIndex = 0;
      return pattern.test(name);
    });
  }

  private decorate(name: string, kind: keyof PrefixSuffixOptions): string {
    const prefix = (this.options.prefix as PrefixSuffixOptions)[kind] || '';
    const suffix = (this.options.suffix as PrefixSuffixOptions)[kind] || '';
    return `${prefix}${name}${suffix}`;
  }

  ensureSelector(className: string): string {
    if (this.shouldIgnore(className, this.options.ignorePatterns.selectors || [])) return className;
    if (this.selectorMap[className]) return this.selectorMap[className];
    const obfuscated = this.decorate(this.selectorGenerator.generate(), 'selectors');
    this.selectorMap[className] = obfuscated;
    return obfuscated;
  }

  ensureIdent(ident: string): string {
    if (this.shouldIgnore(ident, this.options.ignorePatterns.idents || [])) return ident;
    if (this.identMap[ident]) return this.identMap[ident];
    const obfuscated = this.decorate(this.identGenerator.generate(), 'idents');
    this.identMap[ident] = obfuscated;
    return obfuscated;
  }

  reserveCssNames(css: string): void {
    const ast = csstree.parse(css);
    const names = new Set<string>();
    csstree.walk(ast, {
      visit: 'ClassSelector',
      enter: (node: any) => node.name && names.add(csstree.ident.decode(node.name)),
    });
    csstree.walk(ast, {
      visit: 'IdSelector',
      enter: (node: any) => node.name && names.add(csstree.ident.decode(node.name)),
    });
    csstree.walk(ast, {
      visit: 'Atrule',
      enter: (node: any) => {
        if (node.name.toLowerCase() !== 'keyframes' || !node.prelude) return;
        csstree.walk(node.prelude, {
          visit: 'Identifier',
          enter: (identNode: any) => identNode.name && names.add(identNode.name),
        });
      },
    });
    const restoredNames = new Set([...Object.values(this.selectorMap), ...Object.values(this.identMap)]);
    for (const name of names) {
      if (restoredNames.has(name) && this.selectorMap[name] !== name && this.identMap[name] !== name) {
        throw new Error(`Persistent conversion map collides with current CSS name: ${name}`);
      }
    }
    this.selectorGenerator.reserve(names);
    this.identGenerator.reserve(names);
  }

  collectCss(css: string): void {
    this.reserveCssNames(css);
    const ast = csstree.parse(css);
    if (!this.options.enableMarkers) {
      csstree.walk(ast, {
        visit: 'ClassSelector',
        enter: (node: any) => {
          if (!node.name) return;
          const name = csstree.ident.decode(node.name);
          this.activeSelectors.add(name);
          this.ensureSelector(name);
        },
      });
      csstree.walk(ast, {
        visit: 'IdSelector',
        enter: (node: any) => node.name && this.ensureIdent(csstree.ident.decode(node.name)),
      });
    } else {
      csstree.walk(ast, {
        visit: 'ClassSelector',
        enter: (node: any) => {
          if (!node.name) return;
          const name = csstree.ident.decode(node.name);
          if (this.selectorMap[name]) this.activeSelectors.add(name);
        },
      });
    }
    csstree.walk(ast, {
      visit: 'Atrule',
      enter: (node: any) => {
        if (node.name.toLowerCase() !== 'keyframes' || !node.prelude) return;
        csstree.walk(node.prelude, {
          visit: 'Identifier',
          enter: (identNode: any) => identNode.name && this.ensureIdent(identNode.name),
        });
      },
    });
  }

  private transformAst(ast: any): void {
    csstree.walk(ast, {
      visit: 'ClassSelector',
      enter: (node: any) => {
        const mapped = this.selectorMap[csstree.ident.decode(node.name)];
        if (mapped) node.name = csstree.ident.encode(mapped);
      },
    });
    csstree.walk(ast, {
      visit: 'IdSelector',
      enter: (node: any) => {
        const mapped = this.identMap[csstree.ident.decode(node.name)];
        if (mapped) node.name = csstree.ident.encode(mapped);
      },
    });
    csstree.walk(ast, {
      visit: 'Atrule',
      enter: (node: any) => {
        if (node.name.toLowerCase() !== 'keyframes' || !node.prelude) return;
        csstree.walk(node.prelude, {
          visit: 'Identifier',
          enter: (identNode: any) => {
            const mapped = this.identMap[identNode.name];
            if (mapped) identNode.name = mapped;
          },
        });
      },
    });
    csstree.walk(ast, {
      visit: 'Declaration',
      enter: (node: any) => {
        const property = String(node.property || '').toLowerCase();
        if (property !== 'animation' && property !== 'animation-name') return;
        csstree.walk(node.value, {
          visit: 'Identifier',
          enter: (identNode: any) => {
            if (ANIMATION_KEYWORDS.has(identNode.name.toLowerCase())) return;
            const mapped = this.identMap[identNode.name];
            if (mapped) identNode.name = mapped;
          },
        });
      },
    });
  }

  parseCss(css: string): string {
    if (!css) return css;
    this.collectCss(css);
    const ast = csstree.parse(css);
    this.transformAst(ast);
    const transformed = csstree.generate(ast);
    if (transformed === css) return css;
    return this.options.removeOriginalCss ? transformed : `${css}\n${transformed}`;
  }

  getSelectorMap(): ClassConversionMap {
    return { ...this.selectorMap };
  }

  getIdentMap(): ClassConversionMap {
    return { ...this.identMap };
  }

  getActiveSelectorNames(): string[] {
    return [...this.activeSelectors];
  }

  loadMaps(selectorMap: ClassConversionMap = {}, identMap: ClassConversionMap = {}): void {
    this.selectorMap = { ...selectorMap };
    this.identMap = { ...identMap };
    const reserved = [...Object.values(selectorMap), ...Object.values(identMap)];
    this.selectorGenerator.reserve(reserved);
    this.identGenerator.reserve(reserved);
  }
}
