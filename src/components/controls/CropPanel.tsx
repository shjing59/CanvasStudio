import { useCanvasStore, selectActiveImage } from '../../state/canvasStore'
import { PanelSection } from '../ui/PanelSection'
import { CROP_ASPECT_PRESETS, computeCropFromAspect, createDefaultCrop } from '../../lib/canvas/crop'
import type { CropAspectPresetId } from '../../lib/canvas/crop'

/**
 * CropPanel component - controls for cropping the active image.
 * 
 * Features:
 * - Toggle crop mode on/off
 * - Aspect ratio presets (Free, 1:1, 3:2, etc.)
 * - Reset crop to full image
 */
export const CropPanel = () => {
  const activeImage = useCanvasStore(selectActiveImage)
  const cropMode = useCanvasStore((state) => state.cropMode)
  const toggleCropMode = useCanvasStore((state) => state.toggleCropMode)
  const setCrop = useCanvasStore((state) => state.setCrop)
  const resetCrop = useCanvasStore((state) => state.resetCrop)

  const crop = activeImage?.crop

  // Get current aspect preset ID
  const getCurrentPresetId = (): CropAspectPresetId => {
    if (!crop || !crop.aspectLock) return 'free'
    const aspect = crop.lockedAspect
    if (!aspect) return 'free'

    // Find matching preset
    const match = CROP_ASPECT_PRESETS.find(
      (p) => p.value !== null && Math.abs(p.value - aspect) < 0.01
    )
    return match?.id ?? 'free'
  }

  const currentPresetId = getCurrentPresetId()

  // Handle aspect preset change
  const handleAspectChange = (presetId: CropAspectPresetId) => {
    if (!activeImage) return

    const preset = CROP_ASPECT_PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    if (preset.value === null) {
      // Free mode - unlock aspect
      if (crop) {
        setCrop({ ...crop, aspectLock: false, lockedAspect: undefined })
      }
    } else {
      // Locked aspect - compute new crop with this aspect
      const imageAspect = activeImage.image.width / activeImage.image.height
      const newCrop = computeCropFromAspect(imageAspect, preset.value)
      setCrop(newCrop)
    }
  }

  // Handle reset crop
  const handleResetCrop = () => {
    if (!activeImage) return
    setCrop(createDefaultCrop())
  }

  // Handle apply crop (exit crop mode but keep crop)
  const handleApplyCrop = () => {
    toggleCropMode()
  }

  // Handle cancel crop (exit crop mode and remove crop)
  const handleCancelCrop = () => {
    resetCrop()
  }

  const hasImage = !!activeImage

  return (
    <PanelSection
      title="Crop"
      description={cropMode ? 'Adjust the crop region' : 'Crop your image to a specific area'}
    >
      {!cropMode ? (
        // Not in crop mode - show enter button
        <button
          type="button"
          onClick={toggleCropMode}
          disabled={!hasImage}
          className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition ${
            hasImage
              ? 'border-blue-500 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              : 'border-white/10 text-slate-500 cursor-not-allowed'
          }`}
        >
          {crop ? 'Edit Crop' : 'Start Crop'}
        </button>
      ) : (
        // In crop mode - show aspect presets and controls
        <div className="space-y-4 min-w-0">
          {/* Aspect ratio presets */}
          <div className="space-y-2 min-w-0">
            <p className="text-xs text-slate-400">Aspect Ratio</p>
            <div className="flex flex-wrap gap-2 min-w-0 max-w-full">
              {CROP_ASPECT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAspectChange(preset.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition whitespace-nowrap ${
                    currentPresetId === preset.id
                      ? 'border-white bg-white/20 text-white'
                      : 'border-white/10 text-slate-300 hover:border-white/40'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Original aspect option */}
          {activeImage && (
            <button
              type="button"
              onClick={() => {
                const imageAspect = activeImage.image.width / activeImage.image.height
                const newCrop = computeCropFromAspect(imageAspect, imageAspect)
                setCrop({ ...newCrop, aspectLock: true, lockedAspect: imageAspect })
              }}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-white/40"
            >
              Original
            </button>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 min-w-0">
            <button
              type="button"
              onClick={handleResetCrop}
              className="flex-1 min-w-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/40"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleCancelCrop}
              className="flex-1 min-w-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="flex-1 min-w-0 rounded-lg border border-blue-500 bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-400 transition hover:bg-blue-500/30"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Show current crop info when crop is applied */}
      {!cropMode && crop && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Crop applied</span>
          <button
            type="button"
            onClick={handleCancelCrop}
            className="text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      )}
    </PanelSection>
  )
}
