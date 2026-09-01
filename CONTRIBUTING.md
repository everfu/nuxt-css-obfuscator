# Contributing to nuxt-css-obfuscator

Thank you for taking the time to improve `nuxt-css-obfuscator`. Focused bug fixes, compatibility work, tests, documentation improvements, and well-scoped features are welcome.

## Before you start

- Search the [existing issues](https://github.com/everfu/nuxt-css-obfuscator/issues) before creating a new one.
- Open an issue before implementing a large feature, new transformation strategy, or breaking configuration change.
- Keep pull requests focused on one problem.
- Never commit private application output, credentials, generated coverage, or package artifacts.

## Requirements

- Node.js 20.19 or newer
- Corepack
- pnpm 10.28.2, as declared in `package.json`

## Local setup

Fork the repository, then clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/nuxt-css-obfuscator.git
cd nuxt-css-obfuscator
corepack enable
pnpm install
```

Create a branch from `main`:

```bash
git switch -c fix/clear-description
```

Use a short prefix that describes the change, such as `fix/`, `feat/`, `docs/`, or `test/`.

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Rebuild the package in watch mode |
| `pnpm build` | Build the ESM package, CLI, source maps, and declarations |
| `pnpm test` | Run Vitest in watch mode |
| `pnpm test:run` | Run the unit test suite once |
| `pnpm test:integration` | Build the package and run the Nuxt integration fixtures |
| `pnpm test:coverage` | Run unit tests and generate coverage output |
| `pnpm test:ui` | Open the Vitest UI |

## Project structure

```text
src/
├── core/
│   ├── css-parser.ts       # Discovers and rewrites CSS identifiers
│   ├── file-processor.ts   # Transforms supported output formats
│   └── obfuscator.ts       # Coordinates collection, validation, and writes
├── utils/
│   ├── config.ts           # Defaults, loading, merging, and validation
│   ├── generator.ts        # Random and simplified name generation
│   └── logger.ts           # Leveled diagnostics
├── cli-program.ts          # Testable CLI command definition
├── cli.ts                  # Executable entry point
├── index.ts                # Public exports
├── module.ts               # Nuxt and Nitro integration
└── types.ts                # Public TypeScript contracts

tests/
├── core/                   # Parser, processor, and orchestration tests
├── fixtures/               # Nuxt applications used by integration tests
├── integration/            # Nuxt build-level verification
└── utils/                  # Configuration and generator tests
```

## Coding guidelines

- Write TypeScript and follow the existing two-space indentation and semicolon style.
- Keep public behavior typed through `src/types.ts`.
- Preserve the ESM-only package boundary and ESM default-export configuration contract.
- Resolve project-relative paths consistently on Linux, macOS, and Windows.
- Avoid raw text replacement when a structural parser is available.
- Keep transformation failures explicit; do not silently publish partially converted output.
- Do not add a dependency when the existing stack can solve the problem clearly.
- Add comments for non-obvious parsing or build-lifecycle decisions, not for self-explanatory code.

## Testing expectations

Every behavior change should include the smallest useful regression test.

- Add parser and generator cases as unit tests.
- Add file-format replacements to `file-processor` tests.
- Add CLI argument, path, and exit-code behavior to CLI tests.
- Use the Nuxt fixtures when changing module hooks, Nitro output handling, marker transforms, compressed assets, or manifest behavior.
- Cover both the successful path and the relevant failure mode.

Run the same essential checks used by CI before opening a pull request:

```bash
pnpm test:run
pnpm test:integration
pnpm build
```

CI also runs the suite on Linux, macOS, and Windows, and verifies integration against Nuxt 3 and Nuxt 4.

## Documentation expectations

Update documentation in the same pull request when you change:

- a public option, default, CLI flag, or supported config format
- the ESM package export map or generated artifact names
- Node.js or Nuxt compatibility
- module or Nitro lifecycle behavior
- output guarantees, limitations, or migration steps

Keep `README.md`, `README.zh-CN.md`, the example config, public types, and runtime defaults aligned when the affected information appears in those files.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) with an imperative, concise subject:

```text
feat: support a new output format
fix: normalize output paths on Windows
docs: clarify marker mode limitations
test: cover persistent map collisions
refactor: isolate manifest updates
chore: update development tooling
```

Use `!` or a `BREAKING CHANGE:` footer when a change is intentionally incompatible.

## Pull requests

A good pull request explains:

- the problem and why it matters
- the chosen approach and important tradeoffs
- the tests that prove the behavior
- any compatibility, output-size, or migration impact

Before requesting review, confirm that:

- the change has one clear purpose
- unit tests, integration tests, and the package build pass
- new behavior has regression coverage
- documentation and examples match the implementation
- no generated `dist`, coverage, local fixture output, or conversion maps are included
- unrelated formatting or dependency changes are absent

If a check could not be run, state exactly which check was skipped and why.

## Reporting bugs

Open a [GitHub issue](https://github.com/everfu/nuxt-css-obfuscator/issues) with:

- the installed package, Nuxt, Node.js, and package-manager versions
- the relevant obfuscator configuration
- a minimal reproduction or small output sample
- expected and actual behavior
- the full error message with private paths and data removed
- the operating system when paths or generated assets are involved

CSS output can reveal application structure. Remove private source, credentials, internal URLs, and customer data before attaching a reproduction.

## Releases

Releases are maintainer-only. Contributors should not change the package version unless a maintainer requests it.

When a new version reaches `main`, the version workflow creates the matching `v*` tag. The release workflow then builds the package, runs unit and Nuxt integration tests, creates the GitHub release, publishes to npm, and updates the changelog.

## Conduct

Be respectful, assume good intent, and keep feedback specific to the work. Maintainers may close changes that are out of scope, unsafe for generated output, or too broad to review effectively.
