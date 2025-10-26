/**
 * Filesystem Cache Manager
 *
 * Provides caching for CSV data with TTL support to reduce S3 requests
 * and improve response times for frequently accessed data.
 *
 * Cache structure:
 * .data/cache/mortality/{country}/{chartType}_{ageGroup}.csv
 * .data/cache/metadata/world_meta.csv
 */

import { promises as fs, existsSync } from 'fs'
import { join, dirname } from 'path'

const CACHE_BASE_DIR = '.data/cache'
const CACHE_MORTALITY_DIR = join(CACHE_BASE_DIR, 'mortality')
const CACHE_METADATA_DIR = join(CACHE_BASE_DIR, 'metadata')

// Cache TTL: 24 hours for mortality data, 1 hour for metadata
const MORTALITY_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const METADATA_CACHE_TTL = 60 * 60 * 1000 // 1 hour

export class FilesystemCache {
  /**
   * Ensure cache directories exist
   */
  private async ensureCacheDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      console.warn(`Failed to create cache directory ${dir}:`, error)
    }
  }

  /**
   * Get cache file path for mortality data
   */
  private getMortalityCachePath(country: string, chartType: string, ageGroup: string): string {
    const ageSuffix = ageGroup === 'all' ? '' : `_${ageGroup}`
    return join(CACHE_MORTALITY_DIR, country, `${chartType}${ageSuffix}.csv`)
  }

  /**
   * Get cache file path for metadata
   */
  private getMetadataCachePath(): string {
    return join(CACHE_METADATA_DIR, 'world_meta.csv')
  }

  /**
   * Check if cache entry is still valid
   */
  private async isValid(path: string, ttl: number): Promise<boolean> {
    try {
      if (!existsSync(path)) return false

      const stats = await fs.stat(path)
      const age = Date.now() - stats.mtimeMs

      return age < ttl
    } catch {
      return false
    }
  }

  /**
   * Get cached mortality data if valid
   */
  async getMortalityData(
    country: string,
    chartType: string,
    ageGroup: string
  ): Promise<string | null> {
    const path = this.getMortalityCachePath(country, chartType, ageGroup)

    if (await this.isValid(path, MORTALITY_CACHE_TTL)) {
      try {
        return await fs.readFile(path, 'utf-8')
      } catch (error) {
        console.warn(`Failed to read cached mortality data from ${path}:`, error)
      }
    }

    return null
  }

  /**
   * Set cached mortality data
   */
  async setMortalityData(
    country: string,
    chartType: string,
    ageGroup: string,
    data: string
  ): Promise<void> {
    const path = this.getMortalityCachePath(country, chartType, ageGroup)

    try {
      await this.ensureCacheDir(dirname(path))
      await fs.writeFile(path, data, 'utf-8')
    } catch (error) {
      console.warn(`Failed to write mortality data to cache ${path}:`, error)
    }
  }

  /**
   * Get cached metadata if valid
   */
  async getMetadata(): Promise<string | null> {
    const path = this.getMetadataCachePath()

    if (await this.isValid(path, METADATA_CACHE_TTL)) {
      try {
        return await fs.readFile(path, 'utf-8')
      } catch (error) {
        console.warn(`Failed to read cached metadata from ${path}:`, error)
      }
    }

    return null
  }

  /**
   * Set cached metadata
   */
  async setMetadata(data: string): Promise<void> {
    const path = this.getMetadataCachePath()

    try {
      await this.ensureCacheDir(dirname(path))
      await fs.writeFile(path, data, 'utf-8')
    } catch (error) {
      console.warn(`Failed to write metadata to cache ${path}:`, error)
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    try {
      await fs.rm(CACHE_BASE_DIR, { recursive: true, force: true })
      console.log('Cache cleared successfully')
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<void> {
    try {
      // Clear expired mortality data
      if (existsSync(CACHE_MORTALITY_DIR)) {
        const countries = await fs.readdir(CACHE_MORTALITY_DIR)
        for (const country of countries) {
          const countryDir = join(CACHE_MORTALITY_DIR, country)
          const files = await fs.readdir(countryDir)

          for (const file of files) {
            const filePath = join(countryDir, file)
            if (!(await this.isValid(filePath, MORTALITY_CACHE_TTL))) {
              await fs.unlink(filePath)
            }
          }
        }
      }

      // Clear expired metadata
      const metadataPath = this.getMetadataCachePath()
      if (existsSync(metadataPath) && !(await this.isValid(metadataPath, METADATA_CACHE_TTL))) {
        await fs.unlink(metadataPath)
      }
    } catch (error) {
      console.warn('Failed to clear expired cache:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ files: number, size: number }> {
    let files = 0
    let size = 0

    const countFiles = async (dir: string): Promise<void> => {
      try {
        if (!existsSync(dir)) return

        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const path = join(dir, entry.name)
          if (entry.isDirectory()) {
            await countFiles(path)
          } else {
            files++
            const stats = await fs.stat(path)
            size += stats.size
          }
        }
      } catch {
        // Ignore errors
      }
    }

    await countFiles(CACHE_BASE_DIR)

    return { files, size }
  }
}

// Singleton instance
export const filesystemCache = new FilesystemCache()
