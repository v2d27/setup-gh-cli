import * as core from '@actions/core'
import * as os from 'os'
import { HttpClient } from '@actions/http-client'
import getPackageLink from '../src/get'

// Mock the dependencies
jest.mock('@actions/core')
jest.mock('os')
jest.mock('@actions/http-client')

const mockCore = core as jest.Mocked<typeof core>
const mockOs = os as jest.Mocked<typeof os>
const mockHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>

describe('getPackageLink', () => {
  let mockHttpInstance: jest.Mocked<HttpClient>

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockHttpInstance = {
      getJson: jest.fn()
    } as any
    mockHttpClient.mockImplementation

    mockCore.info = jest.fn()
    mockCore.debug = jest.fn()
    mockCore.getInput = jest.fn()
  })

  describe('platform detection', () => {
    it('should map linux platform correctly', async () => {
      mockCore.getInput.mockReturnValue('2.76.2')
      mockOs.platform.mockReturnValue('linux')
      mockOs.arch.mockReturnValue('x64')

      const result = await getPackageLink()

      expect(result.platform).toBe('linux')
      expect(result.packageUrl).toContain('linux')
    })

    it('should map darwin platform to macOS', async () => {
      mockCore.getInput.mockReturnValue('2.76.2')
      mockOs.platform.mockReturnValue('darwin')
      mockOs.arch.mockReturnValue('x64')

      const result = await getPackageLink()

      expect(result.platform).toBe('macOS')
      expect(result.packageUrl).toContain('macOS')
    })

    it('should map win32 platform to windows', async () => {
      mockCore.getInput.mockReturnValue('2.76.2')
      mockOs.platform.mockReturnValue('win32')
      mockOs.arch.mockReturnValue('x64')

      const result = await getPackageLink()

      expect(result.platform).toBe('windows')
      expect(result.packageUrl).toContain('windows')
    })

    it('should throw error for unsupported platform', async () => {
      mockCore.getInput.mockReturnValue('2.76.2')
      mockOs.platform.mockReturnValue('freebsd' as any)
      mockOs.arch.mockReturnValue('x64')

      await expect(getPackageLink()).rejects.toThrow(
        'Unsupported platform: freebsd'
      )
    })
  })

  describe('architecture detection', () => {
    beforeEach(() => {
      mockCore.getInput.mockReturnValue('2.76.2')
      mockOs.platform.mockReturnValue('linux')
    })

    it('should map x64 architecture to amd64', async () => {
      mockOs.arch.mockReturnValue('x64')

      const result = await getPackageLink()

      expect(result.architecture).toBe('amd64')
      expect(result.packageUrl).toContain('amd64')
    })

    it('should map arm64 architecture correctly', async () => {
      mockOs.arch.mockReturnValue('arm64')

      const result = await getPackageLink()

      expect(result.architecture).toBe('arm64')
      expect(result.packageUrl).toContain('arm64')
    })

    it('should map x32 architecture to 386', async () => {
      mockOs.arch.mockReturnValue('x32')

      const result = await getPackageLink()

      expect(result.architecture).toBe('386')
      expect(result.packageUrl).toContain('386')
    })

    it('should map ia32 architecture to 386', async () => {
      mockOs.arch.mockReturnValue('ia32')

      const result = await getPackageLink()

      expect(result.architecture).toBe('386')
      expect(result.packageUrl).toContain('386')
    })

    it('should throw error for unsupported architecture', async () => {
      mockOs.arch.mockReturnValue('mips' as any)

      await expect(getPackageLink()).rejects.toThrow(
        'Unsupported architecture: mips'
      )
    })
  })

  describe('archive format detection', () => {
    beforeEach(() => {
      mockCore.getInput.mockReturnValue('2.76.2')
      mockOs.arch.mockReturnValue('x64')
    })

    it('should use zip format for windows', async () => {
      mockOs.platform.mockReturnValue('win32')

      const result = await getPackageLink()

      expect(result.archiveFormat).toBe('zip')
      expect(result.packageUrl).toContain('.zip')
    })

    it('should use tar.gz format for linux', async () => {
      mockOs.platform.mockReturnValue('linux')

      const result = await getPackageLink()

      expect(result.archiveFormat).toBe('tar.gz')
      expect(result.packageUrl).toContain('.tar.gz')
    })

    it('should use tar.gz format for macOS', async () => {
      mockOs.platform.mockReturnValue('darwin')

      const result = await getPackageLink()

      expect(result.archiveFormat).toBe('tar.gz')
      expect(result.packageUrl).toContain('.tar.gz')
    })
  })

  describe('specific version handling', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('linux')
      mockOs.arch.mockReturnValue('x64')
    })

    it('should construct URL for specific version', async () => {
      mockCore.getInput.mockReturnValue('2.76.1')

      const result = await getPackageLink()

      expect(result.version).toBe('2.76.1')
      expect(result.platform).toBe('linux')
      expect(result.architecture).toBe('amd64')
      expect(result.archiveFormat).toBe('tar.gz')
      expect(result.packageUrl).toBe(
        'https://github.com/cli/cli/releases/download/v2.76.1/gh_2.76.1_linux_amd64.tar.gz'
      )
    })

    it('should handle empty version input as latest', async () => {
      mockCore.getInput.mockReturnValue('')

      const mockRelease = {
        tag_name: 'v2.76.2',
        assets: [
          {
            name: 'gh_2.76.2_linux_amd64.tar.gz',
            url: 'https://api.github.com/repos/cli/cli/releases/assets/12345678',
            id: 12345678,
            label: '',
            state: 'uploaded',
            content_type: 'application/gzip',
            size: 1234567,
            download_count: 100,
            created_at: '2023-10-01T12:00:00Z',
            updated_at: '2023-10-01T12:00:00Z',
            uploader: {
              login: 'cli-bot',
              id: 123456,
              node_id: 'MDQ6VXNlcjEyMzQ1Ng==',
              avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
              gravatar_id: '',
              url: 'https://api.github.com/users/cli-bot',
              html_url: 'https://github.com/cli-bot',
              followers_url: 'https://api.github.com/users/cli-bot/followers',
              following_url:
                'https://api.github.com/users/cli-bot/following{/other_user}',
              gists_url: 'https://api.github.com/users/cli-bot/gists{/gist_id}',
              starred_url:
                'https://api.github.com/users/cli-bot/starred{/owner}{/repo}',
              subscriptions_url:
                'https://api.github.com/users/cli-bot/subscriptions',
              organizations_url: 'https://api.github.com/users/cli-bot/orgs',
              repos_url: 'https://api.github.com/users/cli-bot/repos',
              events_url:
                'https://api.github.com/users/cli-bot/events{/privacy}',
              received_events_url:
                'https://api.github.com/users/cli-bot/received_events',
              type: 'User',
              site_admin: false
            }
          }
        ]
      } as any

      mockHttpInstance.getJson.mockResolvedValueOnce(mockRelease)

      const result = await getPackageLink()

      expect(result.version).toBe('2.76.2')
      expect(result.platform).toBe('linux')
      expect(result.architecture).toBe('amd64')
      expect(result.archiveFormat).toBe('tar.gz')
      expect(result.packageUrl).toBe(
        'https://github.com/cli/cli/releases/download/v2.76.2/gh_2.76.2_linux_amd64.tar.gz'
      )
    })
  })
})
