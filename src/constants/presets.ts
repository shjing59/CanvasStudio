// Export format options
export const EXPORT_FORMATS = ['png', 'jpeg'] as const

// Quality presets for export
export const QUALITY_PRESETS = [
  { label: '100%', value: 1 },
  { label: '90%', value: 0.9 },
  { label: '80%', value: 0.8 },
] as const

// Resolution/scale presets for export
export const RESOLUTION_PRESETS = [
  { label: '100%', value: 1 },
  { label: '75%', value: 0.75 },
  { label: '50%', value: 0.5 },
  { label: '25%', value: 0.25 },
] as const

// Background color presets
export const BACKGROUND_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Light Gray', value: '#f5f5f5' },
  { label: 'Dark Gray', value: '#1a1a1a' },
  { label: 'Transparent', value: 'transparent' },
] as const

// Default values
export const DEFAULT_BACKGROUND_COLOR = '#ffffff'
export const DEFAULT_EXPORT_QUALITY = 1
export const DEFAULT_EXPORT_FORMAT = 'png' as const
export const DEFAULT_RESOLUTION = 1

// Scale constants
export const MIN_SCALE_PERCENT = -100
export const MAX_SCALE_PERCENT = 100
export const DEFAULT_SCALE_OFFSET = 0.95 // -5% relative to fit scale

