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

> **Note**: As a trade-off, obfuscation will make your CSS files larger.

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

The obfuscation will run automatically after the build completes.

### Method 2: Using CLI

1. Create a config file `nuxt-css-obfuscator.config.js`:

```javascript
/** @type {import('nuxt-css-obfuscator').Options} */
module.exports = {
  enable: true,
  mode: 'random',
  refreshClassConversionJson: false,
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs'],
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
| `removeOriginalCss` | `boolean` | `false` | Remove original CSS if obfuscated |
| `generatorSeed` | `number \| undefined` | `undefined` | Seed for random generator |
| `enableJsAst` | `boolean` | `true` | Enable JavaScript AST parsing |
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

## 🤔 How It Works

1. **Extract CSS**: Parses CSS files from the build output
2. **Obfuscate**: Generates obfuscated class names and saves mapping
3. **Replace**: Searches and replaces class names in all build files

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
5. Trigger automatic npm publish
6. Generate changelog using changelogithub

## 📝 License

MIT

## 🙏 Credits

Inspired by [next-css-obfuscator](https://github.com/soranoo/next-css-obfuscator) by [@soranoo](https://github.com/soranoo).
