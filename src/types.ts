export type ObfuscationMode = 'random' | 'simplify' | 'simplify-seedable';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export interface PrefixSuffixOptions {
  selectors?: string;
  idents?: string;
}

export interface IgnorePatterns {
  selectors?: Array<string | RegExp>;
  idents?: Array<string | RegExp>;
}

export interface Options {
  /** Enable or disable the obfuscator */
  enable?: boolean;
  
  /** Obfuscation mode */
  mode?: ObfuscationMode;
  
  /** Build folder path (default: .output) */
  buildFolderPath?: string;
  
  /** Folder to store class conversion JSON */
  classConversionJsonFolderPath?: string;
  
  /** Refresh class conversion JSON on each build */
  refreshClassConversionJson?: boolean;
  
  /** Length of obfuscated class names (for random mode) */
  classLength?: number;
  
  /** Prefix/suffix for obfuscated names */
  prefix?: string | PrefixSuffixOptions;
  suffix?: string | PrefixSuffixOptions;
  
  /** Patterns to ignore during obfuscation */
  ignorePatterns?: IgnorePatterns;
  
  /** File extensions to process */
  allowExtensions?: string[];
  
  /** Regex patterns to ignore in file content */
  contentIgnoreRegexes?: RegExp[];
  
  /** Only obfuscate files in these folders */
  whiteListedFolderPaths?: Array<string | RegExp>;
  
  /** Don't obfuscate files in these folders */
  blackListedFolderPaths?: Array<string | RegExp>;
  
  /** Enable marker-based partial obfuscation */
  enableMarkers?: boolean;
  
  /** Marker class names for partial obfuscation */
  markers?: string[];
  
  /** Remove markers after obfuscation */
  removeMarkersAfterObfuscated?: boolean;
  
  /** Remove original CSS if obfuscated version exists */
  removeOriginalCss?: boolean;
  
  /** Seed for random generator */
  generatorSeed?: number;
  
  /** Enable JavaScript AST parsing */
  enableJsAst?: boolean;
  
  /** Log level */
  logLevel?: LogLevel;
}

export interface ClassConversionMap {
  [originalClass: string]: string;
}

export interface ConversionData {
  selectors: ClassConversionMap;
  idents: ClassConversionMap;
}
