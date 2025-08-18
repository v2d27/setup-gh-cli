# Setup GitHub CLI Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action to install the GitHub CLI (`gh`) on self-hosted runners with
support for multiple platforms and architectures.

## Features

- **Multi-platform support**: Linux, macOS, and Windows
- **Multi-architecture support**: amd64, arm64, and 386 (32-bit)
- **Automatic archive format detection**: tar.gz for Unix-like systems, ZIP for
  Windows
- **Tool caching**: Avoids re-downloading if the same version is already cached
- **Version flexibility**: Install latest version or specify a custom version
- **Platform detection**: Automatically detects the runner's platform and
  architecture

## Supported Platforms and Architectures

| Platform | amd64 | arm64 | 386 |
| -------- | ----- | ----- | --- |
| Linux    | ✅    | ✅    | ✅  |
| macOS    | ✅    | ✅    | ❌  |
| Windows  | ✅    | ✅    | ✅  |

## Usage

### Basic Usage

```yaml
steps:
  - name: Setup GitHub CLI
    uses: v2d27/setup-gh-cli@v1.0
```

### Advanced Usage

```yaml
steps:
  - name: Setup GitHub CLI
    uses: v2d27/setup-gh-cli@v1.0
    with:
      version: 'latest' # Optional: specify GitHub CLI version (default: latest)
```

## Development

### Environment Setup

- Install dependencies:

```bash
npm install
```

- Make sure you have Node.js 20.x or later installed

### Building

Package the TypeScript for distribution:

```bash
npm run bundle
```

### Testing

Run the test suite:

```bash
npm test
```

### Linting

Run ESLint to check for code issues:

```bash
npm run lint
```

### Project Structure

- `src/` - TypeScript source code
  - `main.ts` - Main action logic with multi-platform support
  - `index.ts` - Entry point
- `__tests__/` - Unit tests
- `dist/` - Generated JavaScript (do not edit manually)
- `action.yml` - Action metadata and input/output definitions
