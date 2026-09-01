# nuxt-css-obfuscator

A CSS class name obfuscator for Nuxt.js applications, inspired by [next-css-obfuscator](https://github.com/soranoo/next-css-obfuscator).

## 🎉 Features

- ✅ Works with Nuxt 3 and Nuxt 4
- ✅ Obfuscates CSS class names and IDs
- ✅ Supports multiple obfuscation modes (random, simplify)
- ✅ Partial obfuscation with markers
- ✅ Preserves functionality while making CSS harder to reverse-engineer
- ✅ CLI and Nuxt module support

## ⚠️ Important Notes

> **Warning**: This package is NOT guaranteed to work with every project. Test thoroughly before using in production.

> **Note**: With the safe default `removeOriginalCss: false`, original rules are retained and obfuscated rules are appended, so CSS output is larger. Set it to `true` only after validating the complete production output.

The Nuxt module transforms copied public assets before Nitro records their metadata, then transforms server output from Nitro's `compiled` hook. Each output directory is processed once. Any configuration, parsing, or consistency error fails the production build before transformed files are written.

## 📦 Installation

```bash
npm install -D nuxt-css-obfuscator
```

## 🚀 Quick Start

### Method 1: As a Nuxt Module

1. Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-css-obfuscator'],
  cssObfuscator: {
    enable: true,
    mode: 'random',
    refreshClassConversionJson: false,
  }
})
```

2. Build your project:

```bash
npm run build
```

The obfuscation runs automatically against Nitro's real public and server output directories. Existing precompressed public assets are regenerated after conversion.

### Method 2: Using CLI

1. Create a config file `nuxt-css-obfuscator.config.js`:

```javascript
/** @type {import('nuxt-css-obfuscator').Options} */
module.exports = {
  enable: true,
  mode: 'random',
  refreshClassConversionJson: false,
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs', '.cjs', '.xml', '.xsl'],
};
```

2. Add script to your `package.json`:

```json
{
  "scripts": {
    "obfuscate": "nuxt-css-obfuscator",
    "build": "nuxt build && npm run obfuscate"
  }
}
```

3. Build and obfuscate:

```bash
npm run build
```

## 📖 Configuration Options

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable` | `boolean` | `true` | Enable or disable obfuscation |
| `mode` | `'random' \| 'simplify' \| 'simplify-seedable'` | `'random'` | Obfuscation mode |
| `buildFolderPath` | `string` | `'.output'` | Build folder path |
| `classConversionJsonFolderPath` | `string` | `'./css-obfuscator'` | Folder to store conversion table |
| `refreshClassConversionJson` | `boolean` | `false` | Refresh conversion table on each build |
| `classLength` | `number` | `5` | Length of obfuscated class names (random mode) |

### Advanced Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string \| PrefixSuffixOptions` | `{ selectors: '', idents: '' }` | Prefix for obfuscated names |
| `suffix` | `string \| PrefixSuffixOptions` | `{ selectors: '', idents: '' }` | Suffix for obfuscated names |
| `ignorePatterns` | `IgnorePatterns` | `{ selectors: [], idents: [] }` | Patterns to ignore |
| `allowExtensions` | `string[]` | `['.vue', '.js', '.ts', ...]` | File extensions to process |
| `whiteListedFolderPaths` | `Array<string \| RegExp>` | `[]` | Only obfuscate files in these folders |
| `blackListedFolderPaths` | `Array<string \| RegExp>` | `['./.output/cache']` | Don't obfuscate files in these folders |
| `enableMarkers` | `boolean` | `false` | Enable partial obfuscation with markers |
| `markers` | `string[]` | `['nuxt-css-obfuscation']` | Marker class names |
| `removeMarkersAfterObfuscated` | `boolean` | `true` | Remove markers after obfuscation |
| `removeOriginalCss` | `boolean` | `false` | `false` keeps original rules and appends obfuscated rules; `true` keeps only obfuscated rules after validation |
| `generatorSeed` | `number \| undefined` | `undefined` | Stable seed for `random` and `simplify-seedable` generation |
| `enableJsAst` | `boolean` | `true` | Parse script output structurally; when `false`, the build fails if script references still require replacement |
| `logLevel` | `'silent' \| 'error' \| 'warn' \| 'info' \| 'debug'` | `'info'` | Log level |

## 🎯 Usage Examples

### Full Obfuscation

```javascript
// nuxt-css-obfuscator.config.js
module.exports = {
  enable: true,
  mode: 'random',
  refreshClassConversionJson: false,
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs'],
};
```

### Partial Obfuscation

```javascript
// nuxt-css-obfuscator.config.js
module.exports = {
  enable: true,
  mode: 'random',
  enableMarkers: true,
  markers: ['nuxt-css-obfuscation'],
  removeOriginalCss: false,
};
```

Then in your Vue components:

```vue
<template>
  <div>
    <!-- This will NOT be obfuscated -->
    <div class="container mx-auto">
      <h1 class="text-2xl">Normal content</h1>
    </div>

    <!-- This WILL be obfuscated -->
    <div class="nuxt-css-obfuscation container mx-auto">
      <h1 class="text-2xl">Obfuscated content</h1>
    </div>
  </div>
</template>
```

Marker mode is source-aware when used as a Nuxt module: static classes and statically analyzable `:class` expressions are converted only inside the marked subtree. `enableMarkers: true` cannot be combined with `removeOriginalCss: true`, because unmarked content still needs the original rules.

The CLI supports marker mode only for static HTML, XML, and XSL output. Nuxt SSR or output containing scripts must use module mode so Vue source can be transformed before compilation.

## 💡 Tips

### 1. Development vs Production

Set `refreshClassConversionJson: true` in development and `false` in production:

```javascript
module.exports = {
  enable: process.env.NODE_ENV === 'production',
  refreshClassConversionJson: process.env.NODE_ENV !== 'production',
};
```

### 2. Add to .gitignore

```
/css-obfuscator
```

### 3. Don't Run Obfuscation Twice

Never run the obfuscation command twice in a row without rebuilding. It will corrupt the conversion table.

### 4. Cache Issues

If obfuscation doesn't seem to work, try:
- Deleting `.output/cache` folder
- Hard refresh your browser (Shift + F5)

## 🔧 CLI Options

```bash
nuxt-css-obfuscator [options]

Options:
  -c, --config <path>      Path to config file
  -d, --dir <path>         Project directory (default: current directory)
  --build-dir <path>       Build directory (overrides config)
  --log-level <level>      Log level (silent|error|warn|info|debug)
  -h, --help               Display help
  -V, --version            Display version
```

`--config` accepts TypeScript, ESM, and CommonJS files. A missing or invalid explicit config exits with a non-zero status. The config path, build directory, conversion directory, whitelist, and blacklist are resolved from `--dir` (the project root), not from the shell's current directory.

When the CLI processes a complete Nitro output, it also regenerates existing `.gz`/`.br` files and updates Nitro's asset metadata. If any changed asset cannot be reconciled with that manifest, the command fails instead of leaving mismatched output.

## 🤔 How It Works

1. **Collect**: Parse every eligible CSS file and restore any persistent conversion map
2. **Stage**: Transform CSS, JavaScript, SSR HTML, XML, and XSL in memory using one class/ID/keyframe map
3. **Validate**: Reparse and check staged output for unresolved structured references
4. **Write**: Replace output files and save `conversion.json` only after validation succeeds

Unlike PostCSS-Obfuscator which creates a separate folder, this package directly edits the build files to ensure compatibility with Nuxt.

## 🧪 Testing

This package includes a comprehensive test suite using Vitest.

```bash
# Run tests
pnpm test

# Run tests once
pnpm test:run

# Generate coverage report
pnpm test:coverage

# Open test UI
pnpm test:ui
```

For more details, see [TESTING.md](./TESTING.md).

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm run dev

# Run tests
pnpm test

# Build
pnpm run build
```

### Release

We use automated releases with [changelogithub](https://github.com/antfu/changelogithub):

```bash
# Bump version and release
pnpm run release
```

This will:
1. Prompt you to select version type (patch/minor/major)
2. Update `package.json` version
3. Create git commit and tag
4. Push to GitHub
5. Trigger GitHub Actions to automatically:
   - Build and test the project
   - Create GitHub Release with auto-generated Release Notes
   - Publish to npm
   - Update CHANGELOG.md in the repository using changelogithub

## 📝 License

MIT

## 🙏 Credits

Inspired by [next-css-obfuscator](https://github.com/soranoo/next-css-obfuscator) by [@soranoo](https://github.com/soranoo).
