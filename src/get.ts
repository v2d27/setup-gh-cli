import * as core from '@actions/core'
import * as os from 'os'
import { HttpClient } from '@actions/http-client'

export interface IPackageMetadata {
  platform: string
  architecture: string
  version: string
  archiveFormat: string
  packageUrl: string
}

interface GitHubRelease {
  tag_name: string
  assets: Array<{
    name: string
    browser_download_url: string
  }>
}

const PLATFORM_MAPPING: Record<string, string> = {
  linux: 'linux',
  darwin: 'macOS',
  win32: 'windows'
}

const ARCH_MAPPING: Record<string, string> = {
  x64: 'amd64',
  arm64: 'arm64',
  x32: '386',
  ia32: '386'
}

function getPlatform(): string {
  const nodePlatform = os.platform()
  const mappedPlatform = PLATFORM_MAPPING[nodePlatform]
  if (!mappedPlatform) {
    throw new Error(`Unsupported platform: ${nodePlatform}`)
  }
  return mappedPlatform
}

function getArchitecture(): string {
  const nodeArch = os.arch()
  const mappedArch = ARCH_MAPPING[nodeArch]
  if (!mappedArch) {
    throw new Error(`Unsupported architecture: ${nodeArch}`)
  }
  return mappedArch
}

function getArchiveFormat(platform: string): string {
  return platform === 'windows' ? 'zip' : 'tar.gz'
}

/**
 * Fetches the latest GitHub CLI release information
 */
async function getLatestRelease(): Promise<GitHubRelease> {
  core.info('Fetching the latest GitHub CLI release information')
  const http = new HttpClient('gh-release')
  const response = await http.getJson<GitHubRelease>(
    'https://api.github.com/repos/cli/cli/releases/latest'
  )

  if (!response.result) {
    throw new Error('Failed to fetch release information from GitHub API')
  }

  return response.result
}

/**
 * Finds the appropriate download URL for the specified platform and architecture
 */
function findAssetUrl(
  release: GitHubRelease,
  platform: string,
  architecture: string,
  archiveFormat: string
): string {
  const expectedFileName = `gh_${release.tag_name.replace('v', '')}_${platform}_${architecture}.${archiveFormat}`

  const asset = release.assets.find((asset) => asset.name === expectedFileName)

  if (!asset) {
    core.debug(
      `Available assets: ${release.assets.map((a) => a.name).join(', ')}`
    )
    throw new Error(
      `No suitable asset found for platform: ${platform}, architecture: ${architecture}, format: ${archiveFormat}. Expected: ${expectedFileName}`
    )
  }

  return asset.browser_download_url
}

export default async function getPackageLink(): Promise<IPackageMetadata> {
  const versionInput = core.getInput('version')

  if (versionInput && versionInput !== 'latest') {
    const platform = getPlatform()
    const architecture = getArchitecture()
    const archiveFormat = getArchiveFormat(platform)
    const packageUrl = `https://github.com/cli/cli/releases/download/v${versionInput}/gh_${versionInput}_${platform}_${architecture}.${archiveFormat}`

    return {
      platform,
      architecture,
      version: versionInput,
      archiveFormat,
      packageUrl
    }
  }

  // For latest version, fetch from API and use browser_download_url
  const release = await getLatestRelease()
  const version = release.tag_name.startsWith('v')
    ? release.tag_name.substring(1)
    : release.tag_name
  const platform = getPlatform()
  const architecture = getArchitecture()
  const archiveFormat = getArchiveFormat(platform)
  const packageUrl = findAssetUrl(
    release,
    platform,
    architecture,
    archiveFormat
  )

  core.info(`Latest GitHub CLI version is ${version}`)
  core.info(`Download URL: ${packageUrl}`)

  return {
    platform,
    architecture,
    version,
    archiveFormat,
    packageUrl
  }
}
