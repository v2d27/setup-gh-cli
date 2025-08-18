import * as core from '@actions/core'
import * as os from 'os'

import {
  cacheFile,
  downloadTool,
  extractTar,
  find,
  extractZip
} from '@actions/tool-cache'
import { chmodSync } from 'fs'
import { HttpClient } from '@actions/http-client'

const GH_CLI_TOOL_NAME = 'gh'

/**
 * Platform mapping from Node.js os.platform() to GitHub CLI release names
 */
const PLATFORM_MAPPING: Record<string, string> = {
  linux: 'linux',
  darwin: 'macOS',
  win32: 'windows'
}

/**
 * Architecture mapping from Node.js os.arch() to GitHub CLI release names
 */
const ARCH_MAPPING: Record<string, string> = {
  x64: 'amd64',
  arm64: 'arm64',
  x32: '386',
  ia32: '386'
}

/**
 * Supported combinations of platform and architecture
 */
const SUPPORTED_COMBINATIONS = new Set([
  'linux-amd64',
  'linux-arm64',
  'linux-386',
  'macOS-amd64',
  'macOS-arm64',
  'windows-amd64',
  'windows-arm64',
  'windows-386'
])

run()

export async function run(): Promise<void> {
  try {
    await install()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

/**
 * Get the platform name for GitHub CLI releases
 */
function getPlatform(inputPlatform?: string): string {
  if (inputPlatform) {
    return inputPlatform
  }

  const nodePlatform = os.platform()
  const mappedPlatform = PLATFORM_MAPPING[nodePlatform]

  if (!mappedPlatform) {
    throw new Error(`Unsupported platform: ${nodePlatform}`)
  }

  return mappedPlatform
}

/**
 * Get the architecture name for GitHub CLI releases
 */
function getArchitecture(inputArch?: string): string {
  if (inputArch) {
    return inputArch
  }

  const nodeArch = os.arch()
  const mappedArch = ARCH_MAPPING[nodeArch]

  if (!mappedArch) {
    throw new Error(`Unsupported architecture: ${nodeArch}`)
  }

  return mappedArch
}

/**
 * Get the appropriate archive format for the platform
 */
function getArchiveFormat(platform: string, inputFormat?: string): string {
  if (inputFormat) {
    return inputFormat
  }

  return platform === 'windows' ? 'zip' : 'tar.gz'
}

/**
 * Validate that the platform and architecture combination is supported
 */
function validatePlatformArchCombination(
  platform: string,
  architecture: string
): void {
  const combination = `${platform}-${architecture}`

  if (!SUPPORTED_COMBINATIONS.has(combination)) {
    throw new Error(
      `Unsupported platform-architecture combination: ${combination}. ` +
        `Supported combinations: ${Array.from(SUPPORTED_COMBINATIONS).join(', ')}`
    )
  }
}

/**
 * Install the GH CLI in self hosted runner
 */
async function install(): Promise<void> {
  core.info('Installing GitHub CLI on self-hosted runner')

  const versionInput = core.getInput('version')
  const version =
    !versionInput || versionInput === 'latest'
      ? await getLatestVersion()
      : versionInput

  const platform = getPlatform(core.getInput('platform'))
  const architecture = getArchitecture(core.getInput('architecture'))
  const archiveFormat = getArchiveFormat(
    platform,
    core.getInput('archive_format')
  )

  // Validate the combination is supported
  validatePlatformArchCombination(platform, architecture)

  const packageUrl = `https://github.com/cli/cli/releases/download/v${version}/gh_${version}_${platform}_${architecture}.${archiveFormat}`

  core.info(`Platform: ${platform}`)
  core.info(`Architecture: ${architecture}`)
  core.info(`Archive format: ${archiveFormat}`)
  core.info(`Downloading GitHub CLI from ${packageUrl}`)

  let cliPath = find(GH_CLI_TOOL_NAME, version)

  if (!cliPath) {
    const downloadPath = await downloadTool(
      packageUrl,
      `gh_${platform}_${architecture}`
    )

    // Make the downloaded file executable on Unix-like systems
    if (platform !== 'windows') {
      chmodSync(downloadPath, '755')
    }

    // Extract the archive
    const extractPath =
      archiveFormat === 'tar.gz'
        ? await extractTar(downloadPath)
        : await extractZip(downloadPath)

    // Determine the binary path based on platform
    const binaryName = platform === 'windows' ? 'gh.exe' : 'gh'
    const binaryPath = `${extractPath}/gh_${version}_${platform}_${architecture}/bin/${binaryName}`

    cliPath = await cacheFile(binaryPath, binaryName, GH_CLI_TOOL_NAME, version)
  }

  core.addPath(cliPath)
  core.setOutput('version', version)
  core.info(`GitHub CLI ${version} installed successfully`)
}

async function getLatestVersion(): Promise<string> {
  const http = new HttpClient('gh-release')
  const response = await http.getJson(
    'https://api.github.com/repos/cli/cli/releases/latest'
  )
  let latestVersion = (response.result as { tag_name: string }).tag_name
  latestVersion = latestVersion.startsWith('v')
    ? latestVersion.substring(1)
    : latestVersion
  return latestVersion
}
