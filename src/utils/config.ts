import { existsSync } from 'fs';
import { resolve } from 'path';
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
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs'],
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

export function loadConfig(rootDir: string): Required<Options> {
  const configFiles = [
    'nuxt-css-obfuscator.config.ts',
    'nuxt-css-obfuscator.config.js',
    'nuxt-css-obfuscator.config.cjs',
    'nuxt-css-obfuscator.config.mjs',
  ];

  for (const configFile of configFiles) {
    const configPath = resolve(rootDir, configFile);
    if (existsSync(configPath)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const userConfig = require(configPath);
        const config = userConfig.default || userConfig;
        
        return mergeConfig(DEFAULT_OPTIONS, config);
      } catch (error) {
        console.warn(`Failed to load config from ${configFile}:`, error);
      }
    }
  }

  return DEFAULT_OPTIONS;
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
  
  return merged;
}

export { DEFAULT_OPTIONS };
