import type { FilterFormat, LoaderResult } from '../../types/filter'

/**
 * Base interface for all filter format loaders
 */
export interface FilterLoader {
  /** Format identifier */
  format: FilterFormat
  
  /** File extensions this loader handles */
  extensions: string[]
  
  /** MIME types this loader handles (if applicable) */
  mimeTypes?: string[]
  
  /**
   * Load and parse a filter file
   * @param file - File object or file path
   * @returns Parsed LUT data
   */
  load(file: File | string): Promise<LoaderResult>
  
  /**
   * Validate if a file can be loaded by this loader
   * @param file - File to validate
   * @returns True if this loader can handle the file
   */
  canLoad(file: File): boolean
}

/**
 * Filter loader registry
 * Manages all available filter format loaders
 */
export class FilterLoaderRegistry {
  private loaders: Map<FilterFormat, FilterLoader> = new Map()
  
  /**
   * Register a filter loader
   */
  register(loader: FilterLoader): void {
    this.loaders.set(loader.format, loader)
  }
  
  /**
   * Get a loader by format
   */
  get(format: FilterFormat): FilterLoader | undefined {
    return this.loaders.get(format)
  }
  
  /**
   * Find the appropriate loader for a file
   */
  findLoader(file: File): FilterLoader | undefined {
    for (const loader of this.loaders.values()) {
      if (loader.canLoad(file)) {
        return loader
      }
    }
    
    return undefined
  }
  
  /**
   * Get all supported formats
   */
  getSupportedFormats(): FilterFormat[] {
    return Array.from(this.loaders.keys())
  }
  
  /**
   * Get all registered loaders
   */
  getAllLoaders(): FilterLoader[] {
    return Array.from(this.loaders.values())
  }
}

/**
 * Global filter loader registry instance
 */
export const filterLoaderRegistry = new FilterLoaderRegistry()
