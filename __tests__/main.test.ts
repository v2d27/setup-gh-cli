/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Create mock functions with proper typing
const mockHttpClientInstance = {
  getJson: jest.fn() as jest.MockedFunction<() => Promise<unknown>>
}
const MockHttpClient = jest
  .fn()
  .mockImplementation(() => mockHttpClientInstance)

const mockFind = jest.fn() as jest.MockedFunction<
  (toolName: string, versionSpec: string) => string
>
const mockDownloadTool = jest.fn() as jest.MockedFunction<
  (url: string, dest?: string) => Promise<string>
>
const mockExtractTar = jest.fn() as jest.MockedFunction<
  (file: string, dest?: string) => Promise<string>
>
const mockExtractZip = jest.fn() as jest.MockedFunction<
  (file: string, dest?: string) => Promise<string>
>
const mockCacheFile = jest.fn() as jest.MockedFunction<
  (
    sourceFile: string,
    targetFile: string,
    tool: string,
    version: string
  ) => Promise<string>
>
const mockChmodSync = jest.fn() as jest.MockedFunction<
  (path: string, mode: string) => void
>

// Mock os module
const mockOs = {
  platform: jest.fn() as jest.MockedFunction<() => string>,
  arch: jest.fn() as jest.MockedFunction<() => string>
}

// Set up module mocks
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/tool-cache', () => ({
  find: mockFind,
  downloadTool: mockDownloadTool,
  extractTar: mockExtractTar,
  extractZip: mockExtractZip,
  cacheFile: mockCacheFile
}))
jest.unstable_mockModule('fs', () => ({
  chmodSync: mockChmodSync
}))
jest.unstable_mockModule('@actions/http-client', () => ({
  HttpClient: MockHttpClient
}))
jest.unstable_mockModule('os', () => mockOs)

const { run } = await import('../src/main.js')

describe('GitHub CLI Setup Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set default return values
    core.getInput.mockReturnValue('')
    mockOs.platform.mockReturnValue('linux')
    mockOs.arch.mockReturnValue('x64')

    mockFind.mockReturnValue('')
    mockDownloadTool.mockResolvedValue('/tmp/gh-download')
    mockExtractTar.mockResolvedValue('/tmp/gh-extracted')
    mockExtractZip.mockResolvedValue('/tmp/gh-extracted')
    mockCacheFile.mockResolvedValue('/cached/gh')
    mockHttpClientInstance.getJson.mockResolvedValue({
      result: { tag_name: 'v2.40.1' }
    })
  })

  describe('Basic functionality', () => {
    it('should export run function', async () => {
      expect(typeof run).toBe('function')
    })

    it('should install GitHub CLI successfully with defaults', async () => {
      await run()

      expect(mockHttpClientInstance.getJson).toHaveBeenCalledWith(
        'https://api.github.com/repos/cli/cli/releases/latest'
      )
      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('gh_2.40.1_linux_amd64.tar.gz'),
        'gh_linux_amd64'
      )
      expect(mockExtractTar).toHaveBeenCalled()
      expect(mockCacheFile).toHaveBeenCalled()
      expect(core.setOutput).toHaveBeenCalledWith('version', '2.40.1')
      expect(core.addPath).toHaveBeenCalled()
      expect(core.info).toHaveBeenCalledWith(
        'GitHub CLI 2.40.1 installed successfully'
      )
    })

    it('should use cached tool when available', async () => {
      mockFind.mockReturnValue('/cached/gh/path')

      await run()

      expect(mockDownloadTool).not.toHaveBeenCalled()
      expect(core.addPath).toHaveBeenCalledWith('/cached/gh/path')
      expect(core.setOutput).toHaveBeenCalledWith('version', '2.40.1')
    })
  })

  describe('Version handling', () => {
    it('should use custom version when specified', async () => {
      core.getInput.mockImplementation((name: string) => {
        return name === 'version' ? '2.35.0' : ''
      })

      await run()

      expect(mockHttpClientInstance.getJson).not.toHaveBeenCalled()
      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('v2.35.0'),
        'gh_linux_amd64'
      )
      expect(core.setOutput).toHaveBeenCalledWith('version', '2.35.0')
    })

    it('should handle latest version input explicitly', async () => {
      core.getInput.mockImplementation((name: string) => {
        return name === 'version' ? 'latest' : ''
      })

      await run()

      expect(mockHttpClientInstance.getJson).toHaveBeenCalled()
      expect(core.setOutput).toHaveBeenCalledWith('version', '2.40.1')
    })

    it('should handle version with v prefix', async () => {
      mockHttpClientInstance.getJson.mockResolvedValue({
        result: { tag_name: 'v2.41.0' }
      })

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('version', '2.41.0')
    })

    it('should handle version without v prefix', async () => {
      mockHttpClientInstance.getJson.mockResolvedValue({
        result: { tag_name: '2.41.0' }
      })

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('version', '2.41.0')
    })
  })

  describe('Platform detection', () => {
    it('should use custom platform when specified', async () => {
      core.getInput.mockImplementation((name: string) => {
        return name === 'platform' ? 'windows' : ''
      })

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('windows_amd64.zip'),
        'gh_windows_amd64'
      )
      expect(mockExtractZip).toHaveBeenCalled()
    })

    it('should handle macOS platform detection', async () => {
      mockOs.platform.mockReturnValue('darwin')

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('macOS_amd64.tar.gz'),
        'gh_macOS_amd64'
      )
    })

    it('should handle Windows platform detection', async () => {
      mockOs.platform.mockReturnValue('win32')

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('windows_amd64.zip'),
        'gh_windows_amd64'
      )
      expect(mockExtractZip).toHaveBeenCalled()
      expect(mockChmodSync).not.toHaveBeenCalled()
    })

    it('should throw error for unsupported platform', async () => {
      mockOs.platform.mockReturnValue('freebsd')

      await run()

      expect(core.setFailed).toHaveBeenCalledWith(
        'Unsupported platform: freebsd'
      )
    })
  })

  describe('Architecture detection', () => {
    it('should use custom architecture when specified', async () => {
      core.getInput.mockImplementation((name: string) => {
        return name === 'architecture' ? 'arm64' : ''
      })

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('linux_arm64.tar.gz'),
        'gh_linux_arm64'
      )
    })

    it('should handle arm64 architecture detection', async () => {
      mockOs.arch.mockReturnValue('arm64')

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('linux_arm64.tar.gz'),
        'gh_linux_arm64'
      )
    })

    it('should handle 386 architecture detection from x32', async () => {
      mockOs.arch.mockReturnValue('x32')

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('linux_386.tar.gz'),
        'gh_linux_386'
      )
    })

    it('should handle 386 architecture detection from ia32', async () => {
      mockOs.arch.mockReturnValue('ia32')

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('linux_386.tar.gz'),
        'gh_linux_386'
      )
    })

    it('should throw error for unsupported architecture', async () => {
      mockOs.arch.mockReturnValue('mips')

      await run()

      expect(core.setFailed).toHaveBeenCalledWith(
        'Unsupported architecture: mips'
      )
    })
  })

  describe('Archive format handling', () => {
    it('should use custom archive format when specified', async () => {
      core.getInput.mockImplementation((name: string) => {
        if (name === 'platform') return 'linux'
        if (name === 'archive_format') return 'zip'
        return ''
      })

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('.zip'),
        'gh_linux_amd64'
      )
      expect(mockExtractZip).toHaveBeenCalled()
    })

    it('should auto-detect zip format for Windows', async () => {
      core.getInput.mockImplementation((name: string) => {
        return name === 'platform' ? 'windows' : ''
      })

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('.zip'),
        'gh_windows_amd64'
      )
      expect(mockExtractZip).toHaveBeenCalled()
    })

    it('should auto-detect tar.gz format for non-Windows', async () => {
      core.getInput.mockImplementation((name: string) => {
        return name === 'platform' ? 'linux' : ''
      })

      await run()

      expect(mockDownloadTool).toHaveBeenCalledWith(
        expect.stringContaining('.tar.gz'),
        'gh_linux_amd64'
      )
      expect(mockExtractTar).toHaveBeenCalled()
    })
  })

  describe('Platform-Architecture validation', () => {
    it('should throw error for unsupported platform-architecture combination', async () => {
      core.getInput.mockImplementation((name: string) => {
        if (name === 'platform') return 'macOS'
        if (name === 'architecture') return '386'
        return ''
      })

      await run()

      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining(
          'Unsupported platform-architecture combination: macOS-386'
        )
      )
    })

    it('should validate all supported combinations', async () => {
      const supportedCombinations = [
        ['linux', 'amd64'],
        ['linux', 'arm64'],
        ['linux', '386'],
        ['macOS', 'amd64'],
        ['macOS', 'arm64'],
        ['windows', 'amd64'],
        ['windows', 'arm64'],
        ['windows', '386']
      ]

      for (const [platform, arch] of supportedCombinations) {
        jest.clearAllMocks()
        core.getInput.mockImplementation((name: string) => {
          if (name === 'platform') return platform
          if (name === 'architecture') return arch
          return ''
        })

        await run()

        expect(core.setFailed).not.toHaveBeenCalled()
      }
    })
  })

  describe('Binary path handling', () => {
    it('should use .exe extension for Windows binaries', async () => {
      core.getInput.mockImplementation((name: string) => {
        return name === 'platform' ? 'windows' : ''
      })

      await run()

      expect(mockCacheFile).toHaveBeenCalledWith(
        expect.stringContaining('/bin/gh.exe'),
        'gh.exe',
        'gh',
        '2.40.1'
      )
    })

    it('should not use .exe extension for non-Windows binaries', async () => {
      await run()

      expect(mockCacheFile).toHaveBeenCalledWith(
        expect.stringContaining('/bin/gh'),
        'gh',
        'gh',
        '2.40.1'
      )
    })

    it('should call chmodSync for non-Windows platforms', async () => {
      await run()

      expect(mockChmodSync).toHaveBeenCalledWith('/tmp/gh-download', '755')
    })
  })

  describe('Error handling', () => {
    it('should handle HTTP client errors', async () => {
      mockHttpClientInstance.getJson.mockRejectedValue(
        new Error('Network error')
      )

      await run()

      expect(core.setFailed).toHaveBeenCalledWith('Network error')
    })

    it('should handle download errors', async () => {
      mockDownloadTool.mockRejectedValue(new Error('Download failed'))

      await run()

      expect(core.setFailed).toHaveBeenCalledWith('Download failed')
    })

    it('should handle extraction errors', async () => {
      mockExtractTar.mockRejectedValue(new Error('Extraction failed'))

      await run()

      expect(core.setFailed).toHaveBeenCalledWith('Extraction failed')
    })

    it('should handle cache errors', async () => {
      mockCacheFile.mockRejectedValue(new Error('Cache failed'))

      await run()

      expect(core.setFailed).toHaveBeenCalledWith('Cache failed')
    })

    it('should handle non-Error exceptions', async () => {
      mockHttpClientInstance.getJson.mockRejectedValue('String error')

      await run()

      // Should not call setFailed when error is not an Error instance
      expect(core.setFailed).not.toHaveBeenCalled()
    })
  })
})
