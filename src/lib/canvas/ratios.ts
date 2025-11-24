import type { RatioOption, RatioOptionId } from '../../types/canvas'

export const RATIO_PRESETS: RatioOption[] = [
  { id: '1:1', label: '1 : 1', value: 1, description: 'Square' },
  { id: '3:2', label: '3 : 2', value: 3 / 2, description: 'Landscape' },
  { id: '2:3', label: '2 : 3', value: 2 / 3, description: 'Portrait' },
  { id: '4:5', label: '4 : 5', value: 4 / 5, description: 'Portrait' },
  { id: '9:16', label: '9 : 16', value: 9 / 16, description: 'Story' },
  { id: 'original', label: 'Original', value: null, description: 'Match image' },
  { id: 'custom', label: 'Custom', value: null, description: 'User defined' },
]

export const DEFAULT_RATIO_ID: RatioOptionId = '1:1'

export function findRatioValue(
  id: RatioOptionId,
  params: { custom: { width: number; height: number }; image?: { width: number; height: number } }
): number {
  if (id === 'original') {
    const { image } = params
    if (image) {
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

