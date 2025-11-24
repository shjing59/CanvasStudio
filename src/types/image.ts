export interface ImageMetadata {
  /**
   * Base64 source for preview & export.
   */
  src: string
  /**
   * Native pixel width from the source file.
   */
  width: number
  /**
   * Native pixel height from the source file.
   */
  height: number
  /**
   * Original filename for reference and export naming.
   */
  fileName: string
  /**
   * Captured mime type.
   */
  mimeType: string
  /**
   * Raw EXIF payload when available.
   */
  exif?: Record<string, unknown> | null
  /**
   * Cached HTMLImageElement used for rendering.
   */
  element: HTMLImageElement
}

