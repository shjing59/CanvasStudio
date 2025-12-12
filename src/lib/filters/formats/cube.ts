import { BaseFilterLoader } from './base'
import type { FilterFormat, LoaderResult } from '../../../types/filter'

/**
 * Cube format loader
 * Parses .cube files according to Adobe's LUT format specification
 * 
 * Format specification:
 * - Header comments (lines starting with #)
 * - LUT_3D_SIZE <size> - defines cube dimensions
 * - RGB data lines with 3 space-separated float values (0-1 range)
 */
export class CubeLoader extends BaseFilterLoader {
  format: FilterFormat = 'cube'
  extensions = ['.cube']
  
  async load(file: File | string): Promise<LoaderResult> {
    const text = await this.readFileAsText(file)
    const lines = text.split(/\r?\n/)
    
    let size = 32 // Default size
    const data: number[] = []
    const metadata: {
      title?: string
      domainMin?: [number, number, number]
      domainMax?: [number, number, number]
    } = {}
    
    // Parse lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line) continue
      
      // Parse header comments
      if (line.startsWith('#')) {
        this.parseHeaderLine(line, metadata)
        continue
      }
      
      // Parse LUT_3D_SIZE
      if (line.startsWith('LUT_3D_SIZE')) {
        const parts = line.split(/\s+/)
        if (parts.length >= 2) {
          const parsedSize = parseInt(parts[1], 10)
          if (isNaN(parsedSize) || parsedSize < 2 || parsedSize > 256) {
            throw new Error(`Invalid LUT_3D_SIZE: ${parts[1]}`)
          }
          size = parsedSize
        }
        continue
      }
      
      // Parse DOMAIN_MIN
      if (line.startsWith('DOMAIN_MIN')) {
        const parts = line.split(/\s+/).slice(1)
        if (parts.length >= 3) {
          metadata.domainMin = [
            this.parseFloat(parts[0]),
            this.parseFloat(parts[1]),
            this.parseFloat(parts[2]),
          ]
        }
        continue
      }
      
      // Parse DOMAIN_MAX
      if (line.startsWith('DOMAIN_MAX')) {
        const parts = line.split(/\s+/).slice(1)
        if (parts.length >= 3) {
          metadata.domainMax = [
            this.parseFloat(parts[0]),
            this.parseFloat(parts[1]),
            this.parseFloat(parts[2]),
          ]
        }
        continue
      }
      
      // Parse RGB data line
      // Format: R G B (space-separated floats)
      if (/^-?\d/.test(line)) {
        const parts = line.split(/\s+/).filter((p) => p.length > 0)
        if (parts.length >= 3) {
          const r = this.parseFloat(parts[0])
          const g = this.parseFloat(parts[1])
          const b = this.parseFloat(parts[2])
          
          // Validate values are numbers
          if (isNaN(r) || isNaN(g) || isNaN(b)) {
            console.warn(`Skipping invalid RGB line at line ${i + 1}: ${line}`)
            continue
          }
          
          // Cube files typically use 0-1 range, but some use 0-255
          // Normalize to 0-1 range
          const normalizedR = r > 1 ? r / 255 : r
          const normalizedG = g > 1 ? g / 255 : g
          const normalizedB = b > 1 ? b / 255 : b
          
          data.push(normalizedR, normalizedG, normalizedB)
        }
      }
    }
    
    // Validate data length
    this.validateLUTData(size, data.length)
    
    // Extract title from metadata for filter name
    const filterName = metadata.title || this.extractNameFromFile(file)
    
    return {
      lutData: {
        size,
        data: new Float32Array(data),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
      metadata: {
        name: filterName,
        format: 'cube',
      },
    }
  }
  
  /**
   * Parse header comment line for metadata
   */
  private parseHeaderLine(line: string, metadata: Record<string, any>): void {
    // Remove # and trim
    const content = line.substring(1).trim()
    
    // Parse TITLE:value format
    if (content.startsWith('TITLE:')) {
      metadata.title = content.substring(6).trim().replace(/^["']|["']$/g, '')
      return
    }
    
    // Parse title:value format (case-insensitive)
    const titleMatch = content.match(/^title\s*:\s*(.+)$/i)
    if (titleMatch) {
      metadata.title = titleMatch[1].trim().replace(/^["']|["']$/g, '')
      return
    }
    
    // Some cube files have #title:value format
    const titleMatch2 = content.match(/^title\s*:\s*(.+)$/i)
    if (titleMatch2) {
      metadata.title = titleMatch2[1].trim().replace(/^["']|["']$/g, '')
    }
  }
  
  /**
   * Extract filter name from file path or name
   */
  private extractNameFromFile(file: File | string): string {
    let fileName: string
    if (typeof file === 'string') {
      fileName = file.split('/').pop() || 'filter'
    } else {
      fileName = file.name
    }
    
    // Remove extension and clean up name
    return fileName
      .replace(/\.cube$/i, '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}
