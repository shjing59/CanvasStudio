import type { FilterFormat } from '../../../types/filter'
import type { FilterLoader } from '../loader'

/**
 * Base class for filter loaders
 * Provides common functionality for all format loaders
 */
export abstract class BaseFilterLoader implements FilterLoader {
  abstract format: FilterFormat
  abstract extensions: string[]
  mimeTypes?: string[]
  
  /**
   * Check if a file can be loaded by this loader
   * Default implementation checks file extension
   */
  canLoad(file: File): boolean {
    const fileName = file.name.toLowerCase()
    return this.extensions.some((ext) => fileName.endsWith(ext.toLowerCase()))
  }
  
  /**
   * Load and parse a filter file
   * Must be implemented by subclasses
   */
  abstract load(file: File | string): Promise<import('../../../types/filter').LoaderResult>
  
  /**
   * Read a file as text
   * Handles both File objects and file paths (URLs)
   */
  protected async readFileAsText(file: File | string): Promise<string> {
    if (typeof file === 'string') {
      // Fetch from URL
      const response = await fetch(file)
      if (!response.ok) {
        throw new Error(`Failed to fetch filter file: ${response.statusText}`)
      }
      return response.text()
    } else {
      // Read from File object
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read filter file'))
        reader.readAsText(file)
      })
    }
  }
  
  /**
   * Parse a number from a string, handling scientific notation
   */
  protected parseFloat(value: string): number {
    return parseFloat(value.trim())
  }
  
  /**
   * Validate LUT data
   */
  protected validateLUTData(size: number, dataLength: number): void {
    const expectedLength = size * size * size * 3
    if (dataLength !== expectedLength) {
      throw new Error(
        `Invalid LUT data: expected ${expectedLength} values for size ${size}, got ${dataLength}`
      )
    }
    
    if (size < 2 || size > 256) {
      throw new Error(`Invalid LUT size: ${size} (must be between 2 and 256)`)
    }
    
    // Check if size is a power of 2 (common but not required)
    if (size !== 8 && size !== 16 && size !== 32 && size !== 64 && size !== 128 && size !== 256) {
      console.warn(`LUT size ${size} is not a common power of 2. Performance may be affected.`)
    }
  }
}
