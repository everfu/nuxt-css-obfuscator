<div align="center">

# nuxt-css-obfuscator

### Build-time CSS identifier obfuscation for Nuxt 3 and Nuxt 4.

[![npm version](https://img.shields.io/npm/v/nuxt-css-obfuscator?color=CB3837&logo=npm)](https://www.npmjs.com/package/nuxt-css-obfuscator)
[![Test](https://github.com/everfu/nuxt-css-obfuscator/actions/workflows/test.yml/badge.svg)](https://github.com/everfu/nuxt-css-obfuscator/actions/workflows/test.yml)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520.19-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Nuxt](https://img.shields.io/badge/Nuxt-3%20%7C%204-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com/)
[![License](https://img.shields.io/github/license/everfu/nuxt-css-obfuscator)](LICENSE)

[Installation](#installation) · [Configuration](#configuration) · [CLI](#standalone-cli) · [Contributing](CONTRIBUTING.md) · [简体中文](README.zh-CN.md)

</div>

## Overview

`nuxt-css-obfuscator` rewrites CSS classes, ID selectors, and animation identifiers across a Nuxt production build. One shared conversion map keeps CSS, JavaScript, SSR output, HTML, XML, and XSL references aligned.

Use it as a Nuxt module for the safest integration with Nitro, or run the standalone CLI against an existing build directory.

> [!IMPORTANT]
> Obfuscation makes generated styles harder to inspect; it is not encryption and must not be treated as a security boundary. Test the complete production application before deploying transformed output.

## Why use it?

| Capability | What it provides |
| --- | --- |
| Nuxt-native pipeline | Processes public assets before Nitro records metadata and processes server output after compilation |
| Consistent identifiers | Reuses one map for class names, IDs, keyframes, animation references, and generated application code |
| Staged writes | Collects, transforms, and validates output before replacing build files |
| Persistent mappings | Restores `conversion.json` between builds when map refresh is disabled |
| Partial obfuscation | Limits transformation to marked Vue subtrees when used as a Nuxt module |
| Output integrity | Refreshes existing Brotli/Gzip assets and Nitro asset metadata after changes |
| Cross-platform support | Normalizes project and output paths on Linux, macOS, and Windows |

## Compatibility

- Nuxt `^3.0.0` or `^4.0.0`
- Node.js 20.19 or newer
- SSR and generated Nuxt output

Obfuscation is skipped automatically while the Nuxt development server is running.

## Migrating to v2

Version 2 is ESM-only. Replace CommonJS imports with ESM imports:

```ts
import cssObfuscator from 'nuxt-css-obfuscator';
```

CommonJS applications can load the package with dynamic import while they migrate:

```js
const { default: cssObfuscator } = await import('nuxt-css-obfuscator');
```

Configuration files must also use an ESM default export. Rename `.cjs` configs to `.mjs` or `.ts` and replace `module.exports = { ... }` with `export default { ... }`.

## Installation

```bash
pnpm add -D nuxt-css-obfuscator
```

```bash
npm install --save-dev nuxt-css-obfuscator
```

## Quick start

Add the module and its options to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-css-obfuscator'],

  cssObfuscator: {
    enable: true,
    mode: 'random',
    refreshClassConversionJson: false,
    removeOriginalCss: false,
  },
});
```

Build the application normally:

```bash
pnpm build
```

The module transforms Nitro's actual public and server output directories. If compressed public assets already exist, their `.gz` and `.br` variants are regenerated after conversion.

## Obfuscation modes

| Mode | Output | Best for |
| --- | --- | --- |
| `random` | Fixed-length mixed-case names | General use and less predictable output |
| `simplify` | Sequential short names such as `a`, `b`, `c` | Small output and repeatable traversal order |
| `simplify-seedable` | Short names generated from a seeded alphabet | Compact output with a stable custom sequence |

Set `generatorSeed` when deterministic generation is important. With `refreshClassConversionJson: false`, an existing conversion map is restored before new identifiers are generated.

## Configuration

All options can be placed under `cssObfuscator` in `nuxt.config.ts` or exported from a standalone config file.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enable` | `boolean` | `true` | Enables the obfuscator |
| `mode` | `random \| simplify \| simplify-seedable` | `random` | Selects the name generator |
| `buildFolderPath` | `string` | `.output` | Build directory used by the CLI |
| `classConversionJsonFolderPath` | `string` | `./css-obfuscator` | Directory containing `conversion.json` |
| `refreshClassConversionJson` | `boolean` | `false` | Discards the saved map before a run |
| `classLength` | `number` | `5` | Generated name length in `random` mode |
| `prefix` | `string \| PrefixSuffixOptions` | empty | Adds a prefix to selectors and/or identifiers |
| `suffix` | `string \| PrefixSuffixOptions` | empty | Adds a suffix to selectors and/or identifiers |
| `ignorePatterns` | `IgnorePatterns` | empty arrays | Preserves matching selectors and/or identifiers |
| `allowExtensions` | `string[]` | Vue, JS, TS, HTML, XML, XSL | Chooses file extensions to process |
| `contentIgnoreRegexes` | `RegExp[]` | `[]` | Protects matching content from replacement |
| `whiteListedFolderPaths` | `Array<string \| RegExp>` | `[]` | Restricts processing to matching paths |
| `blackListedFolderPaths` | `Array<string \| RegExp>` | `['./.output/cache']` | Skips matching paths |
| `enableMarkers` | `boolean` | `false` | Enables marker-based partial obfuscation |
| `markers` | `string[]` | `['nuxt-css-obfuscation']` | Defines marker class names |
| `removeMarkersAfterObfuscated` | `boolean` | `true` | Removes marker classes from transformed output |
| `removeOriginalCss` | `boolean` | `false` | Keeps only transformed CSS when enabled |
| `generatorSeed` | `number \| undefined` | `undefined` | Seeds `random` and `simplify-seedable` generation |
| `enableJsAst` | `boolean` | `true` | Uses structural JavaScript parsing for replacements |
| `logLevel` | `silent \| error \| warn \| info \| debug` | `info` | Controls diagnostic output |

String values for `prefix` and `suffix` apply to both selectors and identifiers. Use an object when they need different values:

```ts
cssObfuscator: {
  prefix: {
    selectors: 'c-',
    idents: 'i-',
  },
  ignorePatterns: {
    selectors: ['external-widget', /^third-party-/],
    idents: ['app'],
  },
}
```

See [`nuxt-css-obfuscator.config.example.mjs`](nuxt-css-obfuscator.config.example.mjs) for the complete configuration shape.

## Safe CSS removal

The default `removeOriginalCss: false` keeps the original rules and appends transformed rules. This is the safest way to identify dynamic selectors the obfuscator cannot infer, but it increases CSS size.

Before enabling `removeOriginalCss: true`:

1. Build and test every production route with the default setting.
2. Add runtime-generated or third-party selectors to `ignorePatterns`.
3. Verify hydration, interactive states, teleports, transitions, and external UI libraries.
4. Enable CSS removal and repeat the full production check.

Configuration, parsing, and consistency failures stop the build before partially transformed files are committed.

## Partial obfuscation with markers

Marker mode transforms only statically analyzable classes inside a marked Vue subtree:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-css-obfuscator'],
  cssObfuscator: {
    enableMarkers: true,
    markers: ['obfuscate'],
    removeOriginalCss: false,
  },
});
```

```vue
<template>
  <main>
    <section class="public-shell">
      This subtree keeps its original classes.
    </section>

    <section class="obfuscate private-shell">
      <button :class="{ active: isActive }">
        This subtree is transformed.
      </button>
    </section>
  </main>
</template>
```

`enableMarkers: true` cannot be combined with `removeOriginalCss: true`, because unmarked content still depends on the original rules.

The Nuxt module can transform static classes and statically analyzable `:class` expressions before Vue compilation. CLI marker mode is limited to static HTML, XML, and XSL output; SSR output or builds containing scripts must use module mode.

## Standalone CLI

Use the CLI when the Nuxt module cannot be added to the source application.

Create `nuxt-css-obfuscator.config.ts`, `.js`, or `.mjs` in the project root. The file must use an ESM default export:

```ts
import type { Options } from 'nuxt-css-obfuscator';

export default {
  enable: true,
  mode: 'random',
  buildFolderPath: '.output',
  refreshClassConversionJson: false,
  removeOriginalCss: false,
} satisfies Options;
```

Run it after a fresh Nuxt build:

```bash
pnpm nuxt build
pnpm nuxt-css-obfuscator
```

CLI options:

```text
-c, --config <path>      Path to a config file
-d, --dir <path>         Project directory (default: current directory)
--build-dir <path>       Build directory override
--log-level <level>      silent | error | warn | info | debug
-h, --help               Show help
-V, --version            Show the installed version
```

Config paths, build paths, conversion directories, and folder filters are resolved from `--dir`. Missing, invalid, or CommonJS configs exit with a non-zero status.

Always rebuild the output before running the CLI again. Do not apply a second obfuscation pass to already transformed files.

## How it works

```text
Production build
      │
      ▼
Collect CSS identifiers and restore the saved map
      │
      ▼
Transform eligible output in memory with one shared map
      │
      ▼
Reparse and validate transformed references
      │
      ▼
Write output, conversion.json, compressed assets, and metadata
```

This staged pipeline prevents a validation error from leaving a mixture of original and transformed output.

## Troubleshooting

- **A component loses styling:** preserve runtime-generated classes with `ignorePatterns`, then rebuild.
- **Output appears unchanged:** confirm you are running a production build; the Nuxt module skips development mode.
- **Names change unexpectedly:** preserve `conversion.json` or use `generatorSeed`, and keep `refreshClassConversionJson` disabled.
- **Old assets remain in the browser:** remove stale build output, rebuild, and clear the browser or CDN cache.
- **Marker mode rejects CLI output:** use the Nuxt module for SSR or script-containing builds.

For reproducible bug reports, include a minimal Nuxt project, the obfuscator configuration, and the generated error without private source or credentials.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the local workflow, testing expectations, project structure, and pull request checklist.

## License

Released under the [MIT License](LICENSE).

## Credits

Inspired by [next-css-obfuscator](https://github.com/soranoo/next-css-obfuscator) by [@soranoo](https://github.com/soranoo).
