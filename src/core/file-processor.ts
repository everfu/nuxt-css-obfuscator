import { parse, parseExpression } from '@babel/parser';
import * as csstree from 'css-tree';
import { readFileSync, writeFileSync } from 'fs';
import { extname, relative, sep } from 'path';
import type { ClassConversionMap, Options } from '../types';

export interface TransformResult {
  content: string;
  changed: boolean;
}

interface Edit {
  start: number;
  end: number;
  value: string;
}

interface MarkerMapper {
  selector(name: string): string;
  ident(name: string): string;
}

const SCRIPT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue']);
const DOCUMENT_EXTENSIONS = new Set(['.html', '.xml', '.xsl']);
const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function applyEdits(content: string, edits: Edit[]): string {
  const unique = new Map<string, Edit>();
  for (const edit of edits) unique.set(`${edit.start}:${edit.end}`, edit);
  return [...unique.values()]
    .sort((a, b) => b.start - a.start || b.end - a.end)
    .reduce((result, edit) => result.slice(0, edit.start) + edit.value + result.slice(edit.end), content);
}

function walk(node: any, visitor: (node: any, parent?: any) => boolean | void, parent?: any): void {
  if (!node || typeof node !== 'object') return;
  if (visitor(node, parent) === false) return;
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'start', 'end', 'extra', 'errors', 'comments', 'tokens'].includes(key)) continue;
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visitor, node);
    } else if (value && typeof value === 'object' && 'type' in value) {
      walk(value, visitor, node);
    }
  }
}

export class FileProcessor {
  constructor(private options: Required<Options>, private rootDir = process.cwd()) {}

  isPathAllowed(filePath: string): boolean {
    const normalized = relative(this.rootDir, filePath).split(sep).join('/');
    const matches = (pattern: string | RegExp) => {
      if (typeof pattern === 'string') return normalized.includes(pattern.replace(/^\.\//, '')) || filePath.includes(pattern);
      pattern.lastIndex = 0;
      return pattern.test(normalized);
    };
    if (this.options.whiteListedFolderPaths.length && !this.options.whiteListedFolderPaths.some(matches)) return false;
    if (this.options.blackListedFolderPaths.some(matches)) return false;
    return true;
  }

  shouldProcessFile(filePath: string): boolean {
    return this.options.allowExtensions.includes(extname(filePath)) && this.isPathAllowed(filePath);
  }

  private replaceTokens(value: string, map: ClassConversionMap): string {
    return value.replace(/[^\s]+/g, (token) => map[token] || token);
  }

  private replaceSelector(value: string, selectors: ClassConversionMap, idents: ClassConversionMap): string {
    let result = value;
    for (const [original, mapped] of Object.entries(selectors).sort((a, b) => b[0].length - a[0].length)) {
      result = result.replace(new RegExp(`\\.${this.escapeRegex(original)}(?![\\w-])`, 'g'), `.${mapped}`);
    }
    for (const [original, mapped] of Object.entries(idents).sort((a, b) => b[0].length - a[0].length)) {
      result = result.replace(new RegExp(`#${this.escapeRegex(original)}(?![\\w-])`, 'g'), `#${mapped}`);
    }
    return result;
  }

  private replaceDocumentAttributes(content: string, selectors: ClassConversionMap, idents: ClassConversionMap): string {
    let result = content.replace(/\b(class|className)\s*=\s*(["'])([\s\S]*?)\2/g, (match, name, quote, value) => {
      return `${name}=${quote}${this.replaceTokens(value, selectors)}${quote}`;
    });
    result = result.replace(/\bid\s*=\s*(["'])([^"']*)\1/g, (match, quote, value) => {
      return `id=${quote}${idents[value] || value}${quote}`;
    });
    result = result.replace(/\b(?:href|xlink:href)\s*=\s*(["'])#([^"']+)\1/g, (match, quote, value) => {
      return match.replace(`#${value}`, `#${idents[value] || value}`);
    });
    return result;
  }

  private replaceCssFragment(value: string, selectors: ClassConversionMap, idents: ClassConversionMap): string {
    if (value.includes('<')) {
      return value.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (match, open, css, close) => {
        return `${open}${this.replaceCssFragment(css, selectors, idents)}${close}`;
      });
    }
    if (!/(?:^|[}\s])(?:[.#][^\s,{]+|@(?:keyframes|-webkit-keyframes))[^{}]*\{/.test(value)) return value;
    const ast = csstree.parse(value);
    const expected = new Set<string>();
    csstree.walk(ast, {
      visit: 'ClassSelector',
      enter: (node: any) => {
        const mapped = selectors[csstree.ident.decode(node.name)];
        if (mapped) expected.add(`.${csstree.ident.encode(mapped)}`);
      },
    });
    csstree.walk(ast, {
      visit: 'IdSelector',
      enter: (node: any) => {
        const mapped = idents[csstree.ident.decode(node.name)];
        if (mapped) expected.add(`#${csstree.ident.encode(mapped)}`);
      },
    });
    csstree.walk(ast, {
      visit: 'Atrule',
      enter: (node: any) => {
        if (node.name.toLowerCase() !== 'keyframes' || !node.prelude) return;
        csstree.walk(node.prelude, {
          visit: 'Identifier',
          enter: (identNode: any) => {
            const mapped = idents[identNode.name];
            if (mapped) expected.add(`@keyframes ${mapped}`);
          },
        });
      },
    });
    if (!this.options.removeOriginalCss && expected.size > 0 && [...expected].every((token) => value.includes(token))) {
      return value;
    }
    csstree.walk(ast, {
      visit: 'ClassSelector',
      enter: (node: any) => {
        const mapped = selectors[csstree.ident.decode(node.name)];
        if (mapped) node.name = csstree.ident.encode(mapped);
      },
    });
    csstree.walk(ast, {
      visit: 'IdSelector',
      enter: (node: any) => {
        const mapped = idents[csstree.ident.decode(node.name)];
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
            const mapped = idents[identNode.name];
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
            const mapped = idents[identNode.name];
            if (mapped) identNode.name = mapped;
          },
        });
      },
    });
    const transformed = csstree.generate(ast);
    if (transformed === value) return value;
    return this.options.removeOriginalCss ? transformed : `${value}\n${transformed}`;
  }

  private addStringEdit(node: any, value: string, edits: Edit[]): void {
    if (node.start == null || node.end == null || value === node.value) return;
    edits.push({ start: node.start, end: node.end, value: JSON.stringify(value) });
  }

  private transformValueNode(node: any, kind: 'class' | 'id', selectors: ClassConversionMap, idents: ClassConversionMap, edits: Edit[]): void {
    if (!node) return;
    if (node.type === 'StringLiteral') {
      const value = kind === 'class' ? this.replaceTokens(node.value, selectors) : (idents[node.value] || node.value);
      this.addStringEdit(node, value, edits);
      return;
    }
    if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
      const raw = node.quasis[0]?.value?.cooked || '';
      const value = kind === 'class' ? this.replaceTokens(raw, selectors) : (idents[raw] || raw);
      if (value !== raw) edits.push({ start: node.start, end: node.end, value: `\`${value.replace(/[`\\]/g, '\\$&')}\`` });
      return;
    }
    if (node.type === 'ObjectExpression' && kind === 'class') {
      for (const property of node.properties) {
        if (property.type !== 'ObjectProperty' && property.type !== 'ObjectMethod') continue;
        const key = property.key;
        const original = key.type === 'Identifier' ? key.name : key.value;
        const mapped = typeof original === 'string' ? selectors[original] : undefined;
        if (mapped && key.start != null && key.end != null) {
          edits.push({ start: key.start, end: key.end, value: JSON.stringify(mapped) });
        }
      }
      return;
    }
    if (node.type === 'ArrayExpression') {
      for (const item of node.elements) this.transformValueNode(item, kind, selectors, idents, edits);
    }
  }

  private memberPath(node: any): string {
    if (!node) return '';
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'ThisExpression') return 'this';
    if (node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression') {
      const object = this.memberPath(node.object);
      const property = node.computed ? node.property?.value : node.property?.name;
      return object && property ? `${object}.${property}` : '';
    }
    return '';
  }

  private transformScript(content: string, selectors: ClassConversionMap, idents: ClassConversionMap, filePath: string, cssOnly = false): string {
    if (!this.options.enableJsAst) {
      const unresolved = [...Object.keys(selectors), ...Object.keys(idents)].find((name) => content.includes(name));
      if (unresolved) throw new Error(`JavaScript reference "${unresolved}" remains in ${filePath}. Enable enableJsAst to transform script output safely.`);
      return content;
    }

    const ast = parse(content, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'importAttributes'],
    });
    const edits: Edit[] = [];
    const handled = new Set<any>();
    walk(ast, (node) => {
      if (cssOnly) {
        if (node.type === 'StringLiteral') {
          this.addStringEdit(node, this.replaceCssFragment(node.value, selectors, idents), edits);
        }
        return;
      }
      if (handled.has(node)) return false;
      if (node.type === 'ObjectProperty' || node.type === 'ObjectMethod') {
        const key = node.key?.type === 'Identifier' ? node.key.name : node.key?.value;
        if (key === 'class' || key === 'className' || key === 'staticClass') {
          this.transformValueNode(node.value, 'class', selectors, idents, edits);
          handled.add(node.value);
        } else if (key === 'id') {
          this.transformValueNode(node.value, 'id', selectors, idents, edits);
          handled.add(node.value);
        }
      }
      if (node.type === 'JSXAttribute') {
        const name = node.name?.name;
        if (name === 'class' || name === 'className' || name === 'id') {
          const value = node.value?.type === 'JSXExpressionContainer' ? node.value.expression : node.value;
          this.transformValueNode(value, name === 'id' ? 'id' : 'class', selectors, idents, edits);
          handled.add(value);
        }
      }
      if (node.type === 'AssignmentExpression') {
        const path = this.memberPath(node.left);
        if (/\.(className|class)$/.test(path)) this.transformValueNode(node.right, 'class', selectors, idents, edits);
        if (/\.id$/.test(path)) this.transformValueNode(node.right, 'id', selectors, idents, edits);
        if (/\.style\.animationName$/.test(path)) this.transformValueNode(node.right, 'id', selectors, idents, edits);
      }
      if (node.type === 'CallExpression' || node.type === 'OptionalCallExpression') {
        const path = this.memberPath(node.callee);
        const args = node.arguments || [];
        if (/\.classList\.(add|remove|toggle|contains|replace)$/.test(path)) {
          for (const argument of args) this.transformValueNode(argument, 'class', selectors, idents, edits);
        } else if (/\.(querySelector|querySelectorAll|closest|matches)$/.test(path)) {
          for (const argument of args) {
            if (argument?.type === 'StringLiteral') this.addStringEdit(argument, this.replaceSelector(argument.value, selectors, idents), edits);
          }
        } else if (/\.getElementById$/.test(path)) {
          this.transformValueNode(args[0], 'id', selectors, idents, edits);
        } else if (/\.getElementsByClassName$/.test(path)) {
          this.transformValueNode(args[0], 'class', selectors, idents, edits);
        } else if (/\.setAttribute$/.test(path) && args[0]?.type === 'StringLiteral') {
          if (args[0].value === 'class') this.transformValueNode(args[1], 'class', selectors, idents, edits);
          if (args[0].value === 'id') this.transformValueNode(args[1], 'id', selectors, idents, edits);
        }
      }
      if (node.type === 'StringLiteral') {
        let transformed = this.replaceCssFragment(node.value, selectors, idents);
        if (/\b(?:class|className|id)\s*=/.test(transformed)) {
          transformed = this.replaceDocumentAttributes(transformed, selectors, idents);
        }
        this.addStringEdit(node, transformed, edits);
      }
    });
    return applyEdits(content, edits);
  }

  private withIgnoredContent(content: string, transform: (masked: string) => string): string {
    const values: string[] = [];
    let masked = content;
    for (const configured of this.options.contentIgnoreRegexes) {
      const flags = configured.flags.includes('g') ? configured.flags : `${configured.flags}g`;
      const regex = new RegExp(configured.source, flags);
      masked = masked.replace(regex, (value) => {
        const token = `__NUXT_CSS_OBFUSCATOR_IGNORE_${values.length}__`;
        values.push(value);
        return token;
      });
    }
    let result = transform(masked);
    values.forEach((value, index) => {
      result = result.replace(`__NUXT_CSS_OBFUSCATOR_IGNORE_${index}__`, value);
    });
    return result;
  }

  transformContent(content: string, filePath: string, selectorMap: ClassConversionMap, identMap: ClassConversionMap): TransformResult {
    if (!this.shouldProcessFile(filePath)) return { content, changed: false };
    const extension = extname(filePath);
    const transformed = this.withIgnoredContent(content, (masked) => {
      if (DOCUMENT_EXTENSIONS.has(extension)) {
        return this.options.enableMarkers
          ? this.transformMarkedDocument(masked, { selector: (name) => selectorMap[name] || name, ident: (name) => identMap[name] || name })
          : this.replaceDocumentAttributes(masked, selectorMap, identMap);
      }
      if (extension === '.vue') {
        if (this.options.enableMarkers) {
          return this.transformMarkedDocument(masked, {
            selector: (name) => selectorMap[name] || name,
            ident: (name) => identMap[name] || name,
          });
        }
        return this.transformMarkedDocument(masked, {
          selector: (name) => selectorMap[name] || name,
          ident: (name) => identMap[name] || name,
        }, true);
      }
      if (SCRIPT_EXTENSIONS.has(extension)) {
        return this.transformScript(masked, selectorMap, identMap, filePath, this.options.enableMarkers);
      }
      return masked;
    });
    return { content: transformed, changed: transformed !== content };
  }

  private transformBinding(expression: string, mapper: MarkerMapper, kind: 'class' | 'id', outerQuote: string): string {
    let ast: any;
    try {
      ast = parseExpression(expression, { plugins: ['typescript'] });
    } catch (error) {
      throw new Error(`Marker binding must be statically analyzable: ${expression}: ${String(error)}`);
    }
    const edits: Edit[] = [];
    const quoteValue = (value: string) => outerQuote === '"'
      ? `'${value.replace(/[\\']/g, '\\$&')}'`
      : JSON.stringify(value);
    walk(ast, (node, parent) => {
      if (node.type === 'StringLiteral') {
        const mapped = kind === 'class'
          ? node.value.replace(/[^\s]+/g, (token: string) => mapper.selector(token))
          : mapper.ident(node.value);
        if (mapped !== node.value && node.start != null && node.end != null) {
          edits.push({ start: node.start, end: node.end, value: quoteValue(mapped) });
        }
      }
      if (kind === 'class' && (node.type === 'ObjectProperty' || node.type === 'ObjectMethod') && !node.computed) {
        const key = node.key;
        const original = key.type === 'Identifier' ? key.name : key.value;
        if (typeof original === 'string' && key.start != null && key.end != null) {
          const mapped = mapper.selector(original);
          if (node.shorthand && node.start != null && node.end != null) {
            edits.push({ start: node.start, end: node.end, value: `${quoteValue(mapped)}: ${original}` });
          } else {
            edits.push({ start: key.start, end: key.end, value: quoteValue(mapped) });
          }
        }
        return false;
      }
      if (node.type === 'Identifier' && parent?.type !== 'ObjectProperty') return;
    });
    return applyEdits(expression, edits);
  }

  private transformMarkedTag(tag: string, active: boolean, mapper: MarkerMapper): string {
    if (!active) return tag;
    const markers = new Set(this.options.enableMarkers ? this.options.markers : []);
    let result = tag.replace(/(\s)(class|className)\s*=\s*(["'])([\s\S]*?)\3/g, (match, whitespace, attribute, quote, value) => {
      const classes = value.split(/(\s+)/).map((token: string) => {
        if (!token || /^\s+$/.test(token)) return token;
        if (markers.has(token)) return this.options.removeMarkersAfterObfuscated ? '' : token;
        return mapper.selector(token);
      }).join('').trim();
      return `${whitespace}${attribute}=${quote}${classes}${quote}`;
    });
    result = result.replace(/(\s)id\s*=\s*(["'])([^"']*)\2/g, (match, whitespace, quote, value) => `${whitespace}id=${quote}${mapper.ident(value)}${quote}`);
    result = result.replace(/(\s)(?::class|v-bind:class)\s*=\s*(["'])([\s\S]*?)\2/g, (match, whitespace, quote, value) => `${whitespace}${match.trimStart().slice(0, match.trimStart().indexOf('='))}=${quote}${this.transformBinding(value, mapper, 'class', quote)}${quote}`);
    result = result.replace(/(\s)(?::id|v-bind:id)\s*=\s*(["'])([\s\S]*?)\2/g, (match, whitespace, quote, value) => `${whitespace}${match.trimStart().slice(0, match.trimStart().indexOf('='))}=${quote}${this.transformBinding(value, mapper, 'id', quote)}${quote}`);
    return result;
  }

  transformMarkedDocument(content: string, mapper: MarkerMapper, forceActive = false): string {
    const stack: boolean[] = [];
    const edits: Edit[] = [];
    let cursor = 0;
    while (cursor < content.length) {
      const start = content.indexOf('<', cursor);
      if (start < 0) break;
      if (content.startsWith('<!--', start)) {
        const end = content.indexOf('-->', start + 4);
        cursor = end < 0 ? content.length : end + 3;
        continue;
      }
      let quote = '';
      let end = start + 1;
      for (; end < content.length; end++) {
        const char = content[end];
        if (quote) {
          if (char === quote && content[end - 1] !== '\\') quote = '';
        } else if (char === '"' || char === "'") quote = char;
        else if (char === '>') break;
      }
      if (end >= content.length) break;
      const tag = content.slice(start, end + 1);
      if (/^<\//.test(tag)) {
        stack.pop();
      } else if (!/^<[!?]/.test(tag)) {
        const name = tag.match(/^<\s*([\w:-]+)/)?.[1]?.toLowerCase() || '';
        const staticClass = tag.match(/\bclass\s*=\s*(["'])([\s\S]*?)\1/)?.[2] || '';
        const selfMarked = staticClass.split(/\s+/).some((item) => this.options.markers.includes(item));
        const active = forceActive || (stack[stack.length - 1] || false) || selfMarked;
        const transformed = this.transformMarkedTag(tag, active, mapper);
        if (transformed !== tag) edits.push({ start, end: end + 1, value: transformed });
        if (!/\/\s*>$/.test(tag) && !VOID_ELEMENTS.has(name)) stack.push(active);
      }
      cursor = end + 1;
    }
    return applyEdits(content, edits);
  }

  transformVueSourceWithMarkers(content: string, mapper: MarkerMapper): TransformResult {
    const template = content.match(/<template(?:\s[^>]*)?>([\s\S]*?)<\/template>/);
    if (!template || template.index === undefined) return { content, changed: false };
    const body = template[1];
    const transformedBody = this.transformMarkedDocument(body, mapper);
    if (body === transformedBody) return { content, changed: false };
    const start = template.index + template[0].indexOf(body);
    const transformed = content.slice(0, start) + transformedBody + content.slice(start + body.length);
    return { content: transformed, changed: true };
  }

  processFile(filePath: string, selectorMap: ClassConversionMap, identMap: ClassConversionMap): boolean {
    if (!this.shouldProcessFile(filePath)) return false;
    const original = readFileSync(filePath, 'utf-8');
    const result = this.transformContent(original, filePath, selectorMap, identMap);
    if (result.changed) writeFileSync(filePath, result.content, 'utf-8');
    return true;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
