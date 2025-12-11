import type { TransformState, CropState } from './canvas'

export interface ImageMetadata {
  /**
   * Unique identifier for queue management.
   */
  id: string
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

/**
 * Bundles an image with its positioning state.
 * Each image in the queue has its own transform and optional crop.
 */
export interface ImageState {
  image: ImageMetadata
  transform: TransformState
  /** Crop region in normalized coordinates, null = no crop (show full image) */
  crop: CropState | null
  /** Track if user manually adjusted position/scale */
  isEdited: boolean
}
