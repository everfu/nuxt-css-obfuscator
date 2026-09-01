import { existsSync } from 'fs';
import { resolve } from 'path';
import { createJiti } from 'jiti';
import type { Options, PrefixSuffixOptions } from '../types';

const DEFAULT_OPTIONS: Required<Options> = {
  enable: true,
  mode: 'random',
  buildFolderPath: '.output',
  classConversionJsonFolderPath: './css-obfuscator',
  refreshClassConversionJson: false,
  classLength: 5,
  prefix: { selectors: '', idents: '' },
  suffix: { selectors: '', idents: '' },
  ignorePatterns: {
    selectors: [],
    idents: [],
  },
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs', '.cjs', '.xml', '.xsl'],
  contentIgnoreRegexes: [],
  whiteListedFolderPaths: [],
  blackListedFolderPaths: ['./.output/cache'],
  enableMarkers: false,
  markers: ['nuxt-css-obfuscation'],
  removeMarkersAfterObfuscated: true,
  removeOriginalCss: false,
  generatorSeed: undefined,
  enableJsAst: true,
  logLevel: 'info',
};

function normalizePrefixSuffix(value: string | PrefixSuffixOptions | undefined): PrefixSuffixOptions {
  if (typeof value === 'string') {
    return { selectors: value, idents: value };
  }
  return value || { selectors: '', idents: '' };
}

export function validateConfig(options: Required<Options>): Required<Options> {
  if (options.enableMarkers && options.removeOriginalCss) {
    throw new Error('Invalid configuration: enableMarkers cannot be combined with removeOriginalCss: true. Marker mode must preserve original CSS for unmarked content.');
  }
  if (!['random', 'simplify', 'simplify-seedable'].includes(options.mode)) {
    throw new Error(`Invalid obfuscation mode: ${options.mode}`);
  }
  if (options.classLength < 1) {
    throw new Error('classLength must be at least 1');
  }
  if (!['silent', 'error', 'warn', 'info', 'debug'].includes(options.logLevel)) {
    throw new Error(`Invalid log level: ${options.logLevel}`);
  }
  return options;
}

export async function loadConfig(rootDir: string, explicitPath?: string): Promise<Required<Options>> {
  const configFiles = [
    'nuxt-css-obfuscator.config.ts',
    'nuxt-css-obfuscator.config.js',
    'nuxt-css-obfuscator.config.cjs',
    'nuxt-css-obfuscator.config.mjs',
  ];

  const candidates = explicitPath ? [explicitPath] : configFiles;
  for (const configFile of candidates) {
    const configPath = resolve(rootDir, configFile);
    if (existsSync(configPath)) {
      try {
        const jiti = createJiti(import.meta.url, { interopDefault: true });
        const userConfig = await jiti.import(configPath, { default: true }) as Options;
        return validateConfig(mergeConfig(DEFAULT_OPTIONS, userConfig || {}));
      } catch (error) {
        throw new Error(`Failed to load config from ${configPath}: ${String(error)}`);
      }
    }
  }

  if (explicitPath) {
    throw new Error(`Config file not found: ${resolve(rootDir, explicitPath)}`);
  }
  return validateConfig(mergeConfig(DEFAULT_OPTIONS, {}));
}

export function mergeConfig(defaults: Required<Options>, user: Options): Required<Options> {
  const merged = { ...defaults, ...user };
  
  // Normalize prefix and suffix
  merged.prefix = normalizePrefixSuffix(user.prefix);
  merged.suffix = normalizePrefixSuffix(user.suffix);
  
  // Merge ignore patterns
  if (user.ignorePatterns) {
    merged.ignorePatterns = {
      selectors: [...(defaults.ignorePatterns.selectors || []), ...(user.ignorePatterns.selectors || [])],
      idents: [...(defaults.ignorePatterns.idents || []), ...(user.ignorePatterns.idents || [])],
    };
  }
  
  return validateConfig(merged);
}

export { DEFAULT_OPTIONS };
