import { readFileSync, writeFileSync } from 'fs';
import type { ClassConversionMap, Options } from '../types';
import { logger } from '../utils/logger';

export class FileProcessor {
  private options: Required<Options>;

  constructor(options: Required<Options>) {
    this.options = options;
  }

  private shouldProcessFile(filePath: string): boolean {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    if (!this.options.allowExtensions.includes(ext)) {
      return false;
    }

    // Check whitelist
    if (this.options.whiteListedFolderPaths.length > 0) {
      const inWhitelist = this.options.whiteListedFolderPaths.some(pattern => {
        if (typeof pattern === 'string') {
          return filePath.includes(pattern);
        }
        return pattern.test(filePath);
      });
      if (!inWhitelist) return false;
    }

    // Check blacklist
    if (this.options.blackListedFolderPaths.length > 0) {
      const inBlacklist = this.options.blackListedFolderPaths.some(pattern => {
        if (typeof pattern === 'string') {
          return filePath.includes(pattern);
        }
        return pattern.test(filePath);
      });
      if (inBlacklist) return false;
    }

    return true;
  }

  private replaceClassNames(content: string, conversionMap: ClassConversionMap): string {
    let result = content;

    // Sort by length (longest first) to avoid partial replacements
    const sortedEntries = Object.entries(conversionMap).sort((a, b) => b[0].length - a[0].length);

    for (const [original, obfuscated] of sortedEntries) {
      // Match class names in various contexts
      const patterns = [
        // className="..." or class="..."
        new RegExp(`(class(?:Name)?=["'\`][^"'\`]*\\b)${this.escapeRegex(original)}(\\b[^"'\`]*["'\`])`, 'g'),
        // classList.add/remove/toggle/contains
        new RegExp(`(classList\\.(add|remove|toggle|contains)\\(["\`'])${this.escapeRegex(original)}(["\`']\\))`, 'g'),
        // Vue :class binding
        new RegExp(`(['"\`])${this.escapeRegex(original)}(['"\`]\\s*:)`, 'g'),
      ];

      for (const pattern of patterns) {
        result = result.replace(pattern, `$1${obfuscated}$2`);
      }
    }

    // Handle marker removal if enabled
    if (this.options.enableMarkers && this.options.removeMarkersAfterObfuscated) {
      for (const marker of this.options.markers) {
        const markerPattern = new RegExp(`\\b${this.escapeRegex(marker)}\\s*`, 'g');
        result = result.replace(markerPattern, '');
      }
    }

    return result;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  processFile(filePath: string, selectorMap: ClassConversionMap, identMap: ClassConversionMap): boolean {
    if (!this.shouldProcessFile(filePath)) {
      return false;
    }

    try {
      let content = readFileSync(filePath, 'utf-8');
      
      // Apply content ignore regexes
      const ignoredParts: Array<{ start: number; end: number; content: string }> = [];
      for (const regex of this.options.contentIgnoreRegexes) {
        const matches = content.matchAll(regex);
        for (const match of matches) {
          if (match.index !== undefined) {
            ignoredParts.push({
              start: match.index,
              end: match.index + match[0].length,
              content: match[0]
            });
          }
        }
      }

      // Replace class names
      content = this.replaceClassNames(content, selectorMap);
      
      // Restore ignored parts
      for (const part of ignoredParts.reverse()) {
        content = content.substring(0, part.start) + part.content + content.substring(part.end);
      }

      writeFileSync(filePath, content, 'utf-8');
      logger.debug(`Processed: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to process file ${filePath}:`, error);
      return false;
    }
  }
}
