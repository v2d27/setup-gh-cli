import * as core from '@actions/core'
import getPackageLink, { IPackageMetadata } from './get.js'
import {
  cacheFile,
  downloadTool,
  extractTar,
  find,
  extractZip
} from '@actions/tool-cache'
import { chmodSync } from 'fs'

const GH_CLI_TOOL_NAME = 'gh'

/**
 * Install the GH CLI in self hosted runner
 */
async function install(): Promise<void> {
  core.info('Installing GitHub CLI on self-hosted runner')

  const pkg: IPackageMetadata = await getPackageLink()
  core.info(`Platform: ${pkg.platform}`)
  core.info(`Architecture: ${pkg.architecture}`)
  core.info(`Archive format: ${pkg.archiveFormat}`)
  core.info(`Downloading GitHub CLI from ${pkg.packageUrl}`)

  let cliPath = find(GH_CLI_TOOL_NAME, pkg.version)
  if (cliPath) {
    core.info(`Found existing GitHub CLI at ${cliPath}`)
    return
  }

  const downloadPath = await downloadTool(
    pkg.packageUrl,
    `gh_${pkg.platform}_${pkg.architecture}`
  )

  // Make the downloaded file executable on Unix-like systems
  if (pkg.platform !== 'windows') {
    chmodSync(downloadPath, '755')
  }

  // Extract the archive
  const extractPath =
    pkg.archiveFormat === 'tar.gz'
      ? await extractTar(downloadPath)
      : await extractZip(downloadPath)

  // Determine the binary path based on platform
  const binaryName = pkg.platform === 'windows' ? 'gh.exe' : 'gh'
  const binaryPath = `${extractPath}/gh_${pkg.version}_${pkg.platform}_${pkg.architecture}/bin/${binaryName}`

  cliPath = await cacheFile(
    binaryPath,
    binaryName,
    GH_CLI_TOOL_NAME,
    pkg.version
  )

  core.addPath(cliPath)
  core.setOutput('version', pkg.version)
  core.info(`GitHub CLI ${pkg.version} installed successfully`)
}

/**
 * Main function to run the action
 * This function is the entry point for the action and handles errors.
 */
export async function main(): Promise<void> {
  try {
    await install()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
