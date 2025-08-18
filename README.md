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

1. Install dependencies:

   ```bash
   npm install
   ```

2. Make sure you have Node.js 20.x or later installed

### Building

Package the TypeScript for distribution:

```bash
npm run bundle
```

```bash
$ npm test

PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

## Update the Action Metadata

The [`action.yml`](action.yml) file defines metadata about your action, such as
input(s) and output(s). For details about this file, see
[Metadata syntax for GitHub Actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions).

When you copy this repository, update `action.yml` with the name, description,
inputs, and outputs for your action.

## Update the Action Code

The [`src/`](./src/) directory is the heart of your action! This contains the
source code that will be run when your action is invoked. You can replace the
contents of this directory with your own code.

There are a few things to keep in mind when writing your action code:

- Most GitHub Actions toolkit and CI/CD operations are processed asynchronously.
  In `main.ts`, you will see that the action is run in an `async` function.

  ```javascript
  import * as core from '@actions/core'
  //...

  async function run() {
    try {
      //...
    } catch (error) {
      core.setFailed(error.message)
    }
  }
  ```

  For more information about the GitHub Actions toolkit, see the
  [documentation](https://github.com/actions/toolkit/blob/main/README.md).

So, what are you waiting for? Go ahead and start customizing your action!

1. Create a new branch

   ```bash
   git checkout -b releases/v1
   ```

1. Replace the contents of `src/` with your action code
1. Add tests to `__tests__/` for your source code
1. Format, test, and build the action

   ```bash
   npm run all
   ```

   > This step is important! It will run [`rollup`](https://rollupjs.org/) to
   > build the final JavaScript action code with all dependencies included. If
   > you do not run this step, your action will not work correctly when it is
   > used in a workflow.

1. (Optional) Test your action locally

   The [`@github/local-action`](https://github.com/github/local-action) utility
   can be used to test your action locally. It is a simple command-line tool
   that "stubs" (or simulates) the GitHub Actions Toolkit. This way, you can run
   your TypeScript action locally without having to commit and push your changes
   to a repository.

   The `local-action` utility can be run in the following ways:
   - Visual Studio Code Debugger

     Make sure to review and, if needed, update
     [`.vscode/launch.json`](./.vscode/launch.json)

   - Terminal/Command Prompt

     ```bash
     # npx @github/local action <action-yaml-path> <entrypoint> <dotenv-file>
     npx @github/local-action . src/main.ts .env
     ```

   You can provide a `.env` file to the `local-action` CLI to set environment
   variables used by the GitHub Actions Toolkit. For example, setting inputs and
   event payload data used by your action. For more information, see the example
   file, [`.env.example`](./.env.example), and the
   [GitHub Actions Documentation](https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables).

1. Commit your changes

   ```bash
   git add .
   git commit -m "My first action is ready!"
   ```

1. Push them to your repository

   ```bash
   git push -u origin releases/v1
   ```

1. Create a pull request and get feedback on your action
1. Merge the pull request into the `main` branch

Your action is now published! :rocket:

For information about versioning your action, see
[Versioning](https://github.com/actions/toolkit/blob/main/docs/action-versioning.md)
in the GitHub Actions toolkit.

## Validate the Action

You can now validate the action by referencing it in a workflow file. For
example, [`ci.yml`](./.github/workflows/ci.yml) demonstrates how to reference an
action in the same repository.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Test Local Action
    id: test-action
    uses: ./
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

For example workflow runs, check out the
[Actions tab](https://github.com/actions/typescript-action/actions)! :rocket:

## Usage

After testing, you can create version tag(s) that developers can use to
reference different stable versions of your action. For more information, see
[Versioning](https://github.com/actions/toolkit/blob/main/docs/action-versioning.md)
in the GitHub Actions toolkit.

To include the action in a workflow in another repository, you can use the
`uses` syntax with the `@` symbol to reference a specific branch, tag, or commit
hash.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Test Local Action
    id: test-action
    uses: actions/typescript-action@v1 # Commit with the `v1` tag
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

## Publishing a New Release

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. This script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent SemVer release tag of the current branch, by looking at the local data
   available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the tag retrieved in
   the previous step, and validates the format of the inputted tag (vX.X.X). The
   user is also reminded to update the version field in package.json.
1. **Tagging the new release:** The script then tags a new release and syncs the
   separate major tag (e.g. v1, v2) with the new release tag (e.g. v1.0.0,
   v2.1.2). When the user is creating a new major release, the script
   auto-detects this and creates a `releases/v#` branch for the previous major
   version.
1. **Pushing changes to remote:** Finally, the script pushes the necessary
   commits, tags and branches to the remote repository. From here, you will need
   to create a new release in GitHub so users can easily reference the new tags
   in their workflows.

## Dependency License Management

This template includes a GitHub Actions workflow,
[`licensed.yml`](./.github/workflows/licensed.yml), that uses
[Licensed](https://github.com/licensee/licensed) to check for dependencies with
missing or non-compliant licenses. This workflow is initially disabled. To
enable the workflow, follow the below steps.

1. Open [`licensed.yml`](./.github/workflows/licensed.yml)
1. Uncomment the following lines:

   ```yaml
   # pull_request:
   #   branches:
   #     - main
   # push:
   #   branches:
   #     - main
   ```

1. Save and commit the changes

Once complete, this workflow will run any time a pull request is created or
changes pushed directly to `main`. If the workflow detects any dependencies with
missing or non-compliant licenses, it will fail the workflow and provide details
on the issue(s) found.

### Updating Licenses

Whenever you install or update dependencies, you can use the Licensed CLI to
update the licenses database. To install Licensed, see the project's
[Readme](https://github.com/licensee/licensed?tab=readme-ov-file#installation).

To update the cached licenses, run the following command:

```bash
licensed cache
```

To check the status of cached licenses, run the following command:

```bash
licensed status
```

## Development

### Building

To build the action and generate the distribution files:

```bash
npm run bundle
```

This will:

1. Format the code with Prettier
2. Compile TypeScript to JavaScript
3. Bundle everything into `dist/index.js`

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

### Environment Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Make sure you have Node.js 20.x or later installed

### Project Structure

- `src/` - TypeScript source code
  - `main.ts` - Main action logic with multi-platform support
  - `index.ts` - Entry point
- `__tests__/` - Unit tests
- `dist/` - Generated JavaScript (do not edit manually)
- `action.yml` - Action metadata and input/output definitions
