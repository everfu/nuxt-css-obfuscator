/** @type {import('nuxt-css-obfuscator').Options} */
module.exports = {
  // Enable or disable the obfuscator
  enable: true,

  // Obfuscation mode: 'random', 'simplify', or 'simplify-seedable'
  mode: 'random',

  // Build folder path (default: .output for Nuxt)
  buildFolderPath: '.output',

  // Folder to store class conversion JSON
  classConversionJsonFolderPath: './css-obfuscator',

  // Refresh class conversion JSON on each build
  // Recommended: true in development, false in production
  refreshClassConversionJson: false,

  // Length of obfuscated class names (for random mode)
  classLength: 5,

  // Prefix and suffix for obfuscated names
  prefix: {
    selectors: '',
    idents: '',
  },
  suffix: {
    selectors: '',
    idents: '',
  },

  // Patterns to ignore during obfuscation
  ignorePatterns: {
    selectors: [],
    idents: [],
  },

  // File extensions to process
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs'],

  // Regex patterns to ignore in file content
  contentIgnoreRegexes: [],

  // Only obfuscate files in these folders (empty = all folders)
  whiteListedFolderPaths: [],

  // Don't obfuscate files in these folders
  blackListedFolderPaths: ['./.output/cache'],

  // Enable marker-based partial obfuscation
  enableMarkers: false,

  // Marker class names for partial obfuscation
  markers: ['nuxt-css-obfuscation'],

  // Remove markers after obfuscation
  removeMarkersAfterObfuscated: true,

  // Remove original CSS if obfuscated version exists
  removeOriginalCss: false,

  // Seed for random generator (undefined = random seed)
  generatorSeed: undefined,

  // Enable JavaScript AST parsing (experimental)
  enableJsAst: true,

  // Log level: 'silent', 'error', 'warn', 'info', 'debug'
  logLevel: 'info',
};
