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
    uses: your-username/setup-gh-cli@v1
```

### Advanced Usage

```yaml
steps:
  - name: Setup GitHub CLI
    uses: v2d27/setup-gh-cli@v1
    with:
      version: '2.40.1' # Optional: specify version (default: latest)
      platform: 'Linux' # Optional: Linux, macOS, Windows (default: auto-detect)
      architecture: 'arm64' # Optional: amd64, arm64, 386 (default: amd64)
      archive_format: 'tar.gz' # Optional: tar.gz, ZIP (default: auto-detect)
```

### Cross-platform Example

```yaml
name: Cross-platform GitHub CLI Setup
on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        architecture: [amd64, arm64]
        exclude:
          # macOS doesn't support 386 architecture
          - os: macos-latest
            architecture: 386

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup GitHub CLI
        uses: v2d27/setup-gh-cli@v1
        with:
          architecture: ${{ matrix.architecture }}

      - name: Verify Installation
        run: gh --version
```

## Inputs

| Input            | Description                                         | Required | Default                         |
| ---------------- | --------------------------------------------------- | -------- | ------------------------------- |
| `version`        | Version of GitHub CLI to install (without v prefix) | No       | `latest`                        |
| `platform`       | Platform to install for (Linux, macOS, Windows)     | No       | Auto-detected                   |
| `architecture`   | Architecture to install for (amd64, arm64, 386)     | No       | `amd64`                         |
| `archive_format` | Archive format (tar.gz, ZIP)                        | No       | Auto-detected based on platform |

## Outputs

| Output    | Description                                  |
| --------- | -------------------------------------------- |
| `version` | The version of GitHub CLI that was installed |

## Examples

### Install Latest Version

```yaml
- name: Setup GitHub CLI (Latest)
  uses: v2d27/setup-gh-cli@v1
```

### Install Specific Version

```yaml
- name: Setup GitHub CLI (Specific Version)
  uses: v2d27/setup-gh-cli@v1
  with:
    version: '2.35.0'
```

### Install for ARM64 Architecture

```yaml
- name: Setup GitHub CLI (ARM64)
  uses: v2d27/setup-gh-cli@v1
  with:
    architecture: 'arm64'
```

### Install for Windows with Custom Archive Format

```yaml
- name: Setup GitHub CLI (Windows)
  uses: v2d27/setup-gh-cli@v1
  with:
    platform: 'Windows'
    architecture: 'amd64'
    archive_format: 'ZIP'
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
