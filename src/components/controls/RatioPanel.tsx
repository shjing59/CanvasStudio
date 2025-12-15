import { useMemo, useCallback } from 'react'
import { RATIO_PRESETS } from '../../lib/canvas/ratios'
import { CUSTOM_RATIO } from '../../lib/canvas/constants'
import { useCanvasStore, selectActiveImage } from '../../state/canvasStore'
import { useResponsive } from '../../hooks/useResponsive'
import { PanelSection } from '../ui/PanelSection'
import { PresetButtons } from '../ui/PresetButtons'

/**
 * Validates and clamps a custom ratio value to safe bounds.
 */
function validateRatioValue(value: number): number {
  if (isNaN(value) || !isFinite(value)) return CUSTOM_RATIO.MIN
  return Math.max(CUSTOM_RATIO.MIN, Math.min(CUSTOM_RATIO.MAX, Math.round(value)))
}

// Switches between preset, original, and custom canvas ratios.
export const RatioPanel = () => {
  const { isMobile } = useResponsive()
  const ratioId = useCanvasStore((state) => state.ratioId)
  const activeImage = useCanvasStore(selectActiveImage)
  const setRatio = useCanvasStore((state) => state.setRatio)
  const customRatio = useCanvasStore((state) => state.customRatio)
  const setCustomRatio = useCanvasStore((state) => state.setCustomRatio)

  // Show "Original" ratio only when there's an active image
  const ratioButtons = useMemo(
    () =>
      RATIO_PRESETS.filter((ratio) => (ratio.id === 'original' ? Boolean(activeImage) : true)).map(
        (ratio) => ({ label: ratio.label, value: ratio.id, description: ratio.description })
      ),
    [activeImage]
  )

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = validateRatioValue(Number(e.target.value))
      setCustomRatio({ width: value, height: customRatio.height })
    },
    [customRatio.height, setCustomRatio]
  )

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = validateRatioValue(Number(e.target.value))
      setCustomRatio({ width: customRatio.width, height: value })
    },
    [customRatio.width, setCustomRatio]
  )

  const content = (
    <>
      <div className="min-w-0 max-w-full">
        <PresetButtons
          presets={ratioButtons}
          currentValue={ratioId}
          onChange={setRatio}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs min-w-0">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-slate-400 truncate">Custom width</span>
          <input
            type="number"
            min={CUSTOM_RATIO.MIN}
            max={CUSTOM_RATIO.MAX}
            value={customRatio.width}
            onChange={handleWidthChange}
            className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white focus:border-white/40 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-slate-400 truncate">Custom height</span>
          <input
            type="number"
            min={CUSTOM_RATIO.MIN}
            max={CUSTOM_RATIO.MAX}
            value={customRatio.height}
            onChange={handleHeightChange}
            className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white focus:border-white/40 focus:outline-none"
          />
        </label>
      </div>
      {!isMobile && (
        <p className="text-xs text-slate-500 break-words">
          Custom values auto-apply once both width and height are defined (range: {CUSTOM_RATIO.MIN}-{CUSTOM_RATIO.MAX}).
        </p>
      )}
    </>
  )

  if (isMobile) {
    return <div className="space-y-3">{content}</div>
  }

  return (
    <PanelSection
      title="1. Canvas Ratio"
      description="Switch instantly while preserving layout"
    >
      {content}
    </PanelSection>
  )
}
