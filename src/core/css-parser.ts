import * as csstree from 'css-tree';
import type { ClassConversionMap, Options, PrefixSuffixOptions } from '../types';
import { ClassNameGenerator } from '../utils/generator';
import { logger } from '../utils/logger';

export class CSSParser {
  private options: Required<Options>;
  private generator: ClassNameGenerator;
  private selectorMap: ClassConversionMap = {};
  private identMap: ClassConversionMap = {};

  constructor(options: Required<Options>) {
    this.options = options;
    this.generator = new ClassNameGenerator(
      options.mode,
      options.classLength,
      options.generatorSeed
    );
  }

  private shouldIgnore(name: string, patterns: Array<string | RegExp>): boolean {
    return patterns.some(pattern => {
      if (typeof pattern === 'string') {
        return name === pattern;
      }
      return pattern.test(name);
    });
  }

  private applyPrefixSuffix(name: string, prefix: PrefixSuffixOptions, suffix: PrefixSuffixOptions): string {
    const prefixStr = prefix.selectors || '';
    const suffixStr = suffix.selectors || '';
    return `${prefixStr}${name}${suffixStr}`;
  }

  private obfuscateClassName(className: string): string {
    if (this.shouldIgnore(className, this.options.ignorePatterns.selectors || [])) {
      return className;
    }

    if (this.selectorMap[className]) {
      return this.selectorMap[className];
    }

    const obfuscated = this.applyPrefixSuffix(
      this.generator.generate(),
      this.options.prefix as PrefixSuffixOptions,
      this.options.suffix as PrefixSuffixOptions
    );
    this.selectorMap[className] = obfuscated;
    return obfuscated;
  }

  private obfuscateIdent(ident: string): string {
    if (this.shouldIgnore(ident, this.options.ignorePatterns.idents || [])) {
      return ident;
    }

    if (this.identMap[ident]) {
      return this.identMap[ident];
    }

    const prefix = (this.options.prefix as PrefixSuffixOptions).idents || '';
    const suffix = (this.options.suffix as PrefixSuffixOptions).idents || '';
    const obfuscated = `${prefix}${this.generator.generate()}${suffix}`;
    this.identMap[ident] = obfuscated;
    return obfuscated;
  }

  parseCss(css: string): string {
    try {
      const ast = csstree.parse(css);
      
      csstree.walk(ast, {
        visit: 'ClassSelector',
        enter: (node: any) => {
          if (node.name) {
            node.name = this.obfuscateClassName(node.name);
          }
        }
      });

      csstree.walk(ast, {
        visit: 'IdSelector',
        enter: (node: any) => {
          if (node.name) {
            node.name = this.obfuscateIdent(node.name);
          }
        }
      });

      // Handle animation names
      csstree.walk(ast, {
        visit: 'Atrule',
        enter: (node: any) => {
          if (node.name === 'keyframes' && node.prelude) {
            csstree.walk(node.prelude, {
              visit: 'Identifier',
              enter: (identNode: any) => {
                if (identNode.name) {
                  identNode.name = this.obfuscateIdent(identNode.name);
                }
              }
            });
          }
        }
      });

      return csstree.generate(ast);
    } catch (error) {
      logger.error('Failed to parse CSS:', error);
      return css;
    }
  }

  getSelectorMap(): ClassConversionMap {
    return { ...this.selectorMap };
  }

  getIdentMap(): ClassConversionMap {
    return { ...this.identMap };
  }

  loadMaps(selectorMap: ClassConversionMap, identMap: ClassConversionMap) {
    this.selectorMap = { ...selectorMap };
    this.identMap = { ...identMap };
  }
}
