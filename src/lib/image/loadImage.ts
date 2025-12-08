import * as exifr from 'exifr'
import type { ImageMetadata } from '../../types/image'

/**
 * Generate a unique ID for image identification.
 * Uses crypto.randomUUID() which is available in all modern browsers.
 */
function generateImageId(): string {
  return crypto.randomUUID()
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const createImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.decoding = 'async'
    img.src = src
  })

/**
 * Reads a File into an ImageMetadata object while preserving EXIF metadata.
 * Each loaded image gets a unique ID for queue management.
 */
export async function loadImageFromFile(file: File): Promise<ImageMetadata> {
  const [src, exif] = await Promise.all([readFileAsDataUrl(file), exifr.parse(file).catch(() => null)])
  const element = await createImageElement(src)

  return {
    id: generateImageId(),
    src,
    width: element.naturalWidth,
    height: element.naturalHeight,
    fileName: file.name,
    mimeType: file.type || 'image/jpeg',
    exif: exif as Record<string, unknown> | null,
    element,
  }
}

/**
 * Load multiple images from files.
 * Returns array of ImageMetadata, each with unique ID.
 */
export async function loadImagesFromFiles(files: File[]): Promise<ImageMetadata[]> {
  return Promise.all(files.map(loadImageFromFile))
}
