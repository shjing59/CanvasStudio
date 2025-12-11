import type { RatioOption, RatioOptionId, CropState } from '../../types/canvas'

export const RATIO_PRESETS: RatioOption[] = [
  { id: '1:1', label: '1 : 1', value: 1, description: 'Square' },
  { id: '3:2', label: '3 : 2', value: 3 / 2, description: 'Landscape' },
  { id: '2:3', label: '2 : 3', value: 2 / 3, description: 'Portrait' },
  { id: '5:4', label: '5 : 4', value: 5 / 4, description: 'Landscape' },
  { id: '4:5', label: '4 : 5', value: 4 / 5, description: 'Portrait' },
  { id: '16:9', label: '16 : 9', value: 16 / 9, description: 'Wide' },
  { id: '9:16', label: '9 : 16', value: 9 / 16, description: 'Story' },
  { id: 'original', label: 'Original', value: null, description: 'Match image' },
  { id: 'custom', label: 'Custom', value: null, description: 'User defined' },
]

export const DEFAULT_RATIO_ID: RatioOptionId = '3:2'

/**
 * Get the ratio value for a given ratio ID.
 * When 'original' is selected and crop exists, uses cropped aspect ratio.
 */
export function findRatioValue(
  id: RatioOptionId,
  params: { 
    custom: { width: number; height: number }
    image?: { width: number; height: number }
    crop?: CropState | null
  }
): number {
  if (id === 'original') {
    const { image, crop } = params
    if (image) {
      // If crop exists, use cropped aspect ratio
      if (crop) {
        const croppedWidth = image.width * crop.width
        const croppedHeight = image.height * crop.height
        return croppedWidth / croppedHeight
      }
      return image.width / image.height
    }
    return 1
  }
  if (id === 'custom') {
    const { width, height } = params.custom
    if (width > 0 && height > 0) {
      return width / height
    }
    return 1
  }
  const preset = RATIO_PRESETS.find((ratio) => ratio.id === id)
  return preset?.value ?? 1
}

