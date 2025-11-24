import * as exifr from 'exifr'
import type { ImageMetadata } from '../../types/image'

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

// Reads a File into an HTMLImageElement while preserving EXIF metadata.
export async function loadImageFromFile(file: File): Promise<ImageMetadata> {
  const [src, exif] = await Promise.all([readFileAsDataUrl(file), exifr.parse(file).catch(() => null)])
  const element = await createImageElement(src)

  return {
    src,
    width: element.naturalWidth,
    height: element.naturalHeight,
    fileName: file.name,
    mimeType: file.type || 'image/jpeg',
    exif: exif as Record<string, unknown> | null,
    element,
  }
}

