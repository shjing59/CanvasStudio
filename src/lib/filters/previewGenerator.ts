import type { ImageMetadata } from '../../types/image'
import { applyLUTToCanvas } from './processor'
import { loadBuiltinFilter } from './presets'
import { filterLoaderRegistry } from './loader'

/**
 * Cache for filter preview thumbnails
 * Key: `sample-${filterId}` or `sample-none`
 * Value: data URL string
 */
const previewCache = new Map<string, string>()

/**
 * Cached sample image metadata (loaded once)
 */
let cachedSampleImage: ImageMetadata | null = null

/**
 * Generate a preview from the static sample image with a filter applied
 * @param filterId Filter ID to apply
 * @param size Preview size (default 80px)
 * @returns Data URL of the preview image
 */
export async function generateSampleFilterPreview(
  filterId: string,
  size: number = 80
): Promise<string> {
  const cacheKey = `sample-${filterId}`
  
  // Check cache first
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!
  }

  try {
    // Load sample image (cached after first load)
    if (!cachedSampleImage) {
      cachedSampleImage = await loadSampleImage()
    }
    const sampleImage = cachedSampleImage

    // Load filter
    const { BUILTIN_FILTERS } = await import('./presets')
    const filterMetadata = BUILTIN_FILTERS.find((f) => f.id === filterId)
    if (!filterMetadata) {
      throw new Error(`Filter not found: ${filterId}`)
    }

    const file = await loadBuiltinFilter(filterMetadata)
    const loader = filterLoaderRegistry.findLoader(file)
    if (!loader) {
      throw new Error(`No loader found for filter: ${filterId}`)
    }

    const result = await loader.load(file)

    // Create preview canvas
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })
    
    if (!ctx) {
      throw new Error('Failed to create canvas context')
    }

    // Calculate crop to make it square (center crop)
    const sourceSize = Math.min(sampleImage.width, sampleImage.height)
    const sourceX = (sampleImage.width - sourceSize) / 2
    const sourceY = (sampleImage.height - sourceSize) / 2

    // Draw source image (cropped to square)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      sampleImage.element,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
    )

    // Apply filter at full intensity
    applyLUTToCanvas(ctx, result.lutData, 1.0, {
      x: 0,
      y: 0,
      width: size,
      height: size,
    })

    // Convert to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.9)

    // Cache the result
    previewCache.set(cacheKey, dataURL)

    return dataURL
  } catch (error) {
    console.error('Failed to generate sample filter preview:', error)
    // Return a gray placeholder
    return generateGrayPlaceholder(size)
  }
}

/**
 * Generate a preview from the static sample image without any filter
 * @param size Preview size (default 80px)
 * @returns Data URL of the preview image
 */
export async function generateSamplePreviewNoFilter(
  size: number = 80
): Promise<string> {
  const cacheKey = 'sample-none'
  
  // Check cache first
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!
  }

  try {
    // Load sample image (cached after first load)
    if (!cachedSampleImage) {
      cachedSampleImage = await loadSampleImage()
    }
    const sampleImage = cachedSampleImage

    // Create preview canvas
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })
    
    if (!ctx) {
      throw new Error('Failed to create canvas context')
    }

    // Calculate crop to make it square (center crop)
    const sourceSize = Math.min(sampleImage.width, sampleImage.height)
    const sourceX = (sampleImage.width - sourceSize) / 2
    const sourceY = (sampleImage.height - sourceSize) / 2

    // Draw source image (cropped to square, no filter)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      sampleImage.element,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
    )

    // Convert to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.9)

    // Cache the result
    previewCache.set(cacheKey, dataURL)

    return dataURL
  } catch (error) {
    console.error('Failed to generate sample preview:', error)
    // Return a gray placeholder
    return generateGrayPlaceholder(size)
  }
}

/**
 * Load the sample image from public folder
 */
async function loadSampleImage(): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Remove crossOrigin for same-origin requests (public folder)
    // img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Sample image loaded but has invalid dimensions'))
        return
      }
      resolve({
        id: 'sample',
        src: img.src,
        element: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileName: 'sample.jpg',
        mimeType: 'image/jpeg',
      })
    }
    img.onerror = (error) => {
      console.error('Failed to load sample image from /CanvasStudio/sample.jpg', error)
      reject(new Error(`Failed to load sample image: ${img.src}`))
    }
    // Use base path from vite config (CanvasStudio)
    img.src = '/CanvasStudio/sample.jpg'
  })
}


/**
 * Generate a gray placeholder
 */
function generateGrayPlaceholder(size: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    return ''
  }

  ctx.fillStyle = '#333333'
  ctx.fillRect(0, 0, size, size)
  
  return canvas.toDataURL('image/png')
}

/**
 * Clear the preview cache (useful for memory management)
 */
export function clearPreviewCache(): void {
  previewCache.clear()
}


