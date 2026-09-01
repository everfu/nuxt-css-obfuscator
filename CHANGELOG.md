# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note**: Starting from v1.0.0, this changelog is automatically generated using [changelogithub](https://github.com/antfu/changelogithub).

## [2.0.0] - 2026-09-01

### Changed

- **Breaking:** The npm package now publishes ESM only. Use `import` or dynamic `import()` instead of `require()`.
- **Breaking:** Configuration files must use an ESM default export from a `.ts`, `.js`, or `.mjs` file. `.cjs` and `module.exports` configs are rejected.
- Added `"type": "module"` and changed the build to emit one ESM package and CLI entry.
- Updated tests and GitHub workflows to use ESM-native imports and package inspection.
- The CLI now reads its version from `package.json` instead of duplicating it in source.

### Fixed

- Removed the Vite CommonJS Node API deprecation warning emitted while loading the Vitest configuration.

### Migration

- Replace `const obfuscator = require('nuxt-css-obfuscator')` with `import obfuscator from 'nuxt-css-obfuscator'`.
- Rename `.cjs` configs to `.mjs` or `.ts` and replace `module.exports` with `export default`.

## [1.0.0] - 2025-11-29

### Added
- ✨ **Nuxt 4 Support** - Full compatibility with Nuxt 4 while maintaining Nuxt 3 support
- 🎯 Core CSS obfuscation engine
- 🔧 Multiple obfuscation modes (random, simplify, simplify-seedable)
- 📦 Nuxt module integration for automatic obfuscation
- 💻 CLI tool for manual obfuscation
- 🎨 Class name generator with customizable patterns
- 📝 Comprehensive TypeScript type definitions
- 🌐 Full documentation in English and Chinese
- 🔍 Partial obfuscation support with markers
- ⚙️ Flexible configuration system
- 📊 Whitelist/blacklist folder support
- 🚫 Ignore patterns for specific class names
- 🔄 Conversion table persistence
- 📈 Detailed logging with configurable levels

### Changed
- 📦 Updated `@nuxt/kit` dependency to support both Nuxt 3 and 4 (`^3.13.0 || ^4.0.0`)
- 🔧 Updated `peerDependencies` to accept Nuxt 3 and 4 (`^3.0.0 || ^4.0.0`)
- 📝 Updated module compatibility to `>=3.0.0`
- 📚 Enhanced documentation with Nuxt 4 compatibility notes

### Documentation
- 📖 README.md - Complete English documentation
- 📖 README.zh-CN.md - Complete Chinese documentation
- 🚀 QUICK_START.md - Quick start guide
- 🔧 SETUP.md - Developer setup guide
- 📊 PROJECT_SUMMARY.md - Technical architecture summary
- 🆕 NUXT4_COMPATIBILITY.md - Nuxt 4 compatibility guide
- 📝 CHANGELOG.md - This changelog

### Technical Details
- Built with TypeScript 5.3+
- Uses css-tree for CSS parsing
- Fast-glob for efficient file searching
- Commander for CLI interface
- Chalk for colored terminal output

### Compatibility
- ✅ Nuxt 3.x (all versions)
- ✅ Nuxt 4.x (all versions)
- ✅ Node.js 16+
- ✅ TypeScript 5.0+

### Package Information
- **Name**: nuxt-css-obfuscator
- **Version**: 1.0.0
- **License**: MIT
- **Keywords**: nuxt, nuxt3, nuxt4, css, obfuscator, obfuscation, class-names, css-modules, security

---

## Future Roadmap

### Planned Features
- [ ] Source map support
- [ ] Better error messages and debugging
- [ ] Performance optimizations
- [ ] CSS-in-JS support
- [ ] Visual configuration tool
- [ ] Obfuscation preview tool
- [ ] Integration with popular UI frameworks
- [ ] Advanced caching mechanisms
- [ ] Incremental obfuscation

### Under Consideration
- [ ] Browser extension for testing
- [ ] Online playground
- [ ] VS Code extension
- [ ] Webpack plugin version
- [ ] Vite plugin version

---

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## Support

- 📝 [Documentation](./README.md)
- 🐛 [Issue Tracker](https://github.com/everfu/nuxt-css-obfuscator/issues)
- 💬 [Discussions](https://github.com/everfu/nuxt-css-obfuscator/discussions)

## License

MIT License - see [LICENSE](./LICENSE) for details

---

**Note**: This is the initial release. Future versions will be documented here.
