import { useMemo } from 'react'
import { useCanvasStore, selectFitScale } from '../../state/canvasStore'
import { PanelSection } from '../ui/PanelSection'
import { ToggleButton } from '../ui/ToggleButton'

// Gives fine-grained control over scale toggles + center snapping + reset flows.
export const TransformPanel = () => {
  const transform = useCanvasStore((state) => state.transform)
  const adjustScale = useCanvasStore((state) => state.adjustScale)
  const resetTransform = useCanvasStore((state) => state.resetTransform)
  const centerSnap = useCanvasStore((state) => state.centerSnap)
  const setCenterSnap = useCanvasStore((state) => state.setCenterSnap)
  const previewSize = useCanvasStore((state) => state.previewSize)
  const updateTransform = useCanvasStore((state) => state.updateTransform)
  const fitImageToCanvas = useCanvasStore((state) => state.fitImageToCanvas)

  // Use the store's selector for fit scale (single source of truth)
  const fitScale = useCanvasStore(selectFitScale)

  const scalePercent = useMemo(() => {
    if (!fitScale || fitScale === 0) return 0
    const percent = ((transform.scale / fitScale) - 1) * 100
    return Math.max(-100, Math.min(100, percent))
  }, [fitScale, transform.scale])

  const handleScalePercentChange = (value: number) => {
    if (!fitScale) return
    const actualScale = Math.max(0.01, fitScale * (1 + value / 100))
    updateTransform({ scale: actualScale })
  }

  const positionSlider = useMemo(() => {
    if (!previewSize) return { x: 0, y: 0 }
    const halfWidth = previewSize.width / 2 || 1
    const halfHeight = previewSize.height / 2 || 1
    return {
      x: Math.max(-100, Math.min(100, (transform.x / halfWidth) * 100)),
      y: Math.max(-100, Math.min(100, (transform.y / halfHeight) * 100)),
    }
  }, [previewSize, transform.x, transform.y])

  const handlePositionChange = (axis: 'x' | 'y') => (value: number) => {
    if (!previewSize) return
    const half = axis === 'x' ? previewSize.width / 2 : previewSize.height / 2
    if (half === 0) return
    updateTransform({ [axis]: (value / 100) * half })
  }

  return (
    <PanelSection
      title="2. Position & Scale"
      description="Drag to move. Wheel, pinch, or Shift + Drag to scale."
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Scale</span>
          <span className="text-white">{scalePercent.toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={scalePercent}
          onChange={(event) => handleScalePercentChange(Number(event.target.value))}
          className="w-full accent-white"
        />
        <p className="text-[11px] text-slate-500">
          -100% keeps the image fully fitting inside the canvas, 0% equals the fitted size, positive
          values zoom in.
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Horizontal</span>
          <span className="text-white">{positionSlider.x.toFixed(0)}</span>
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={positionSlider.x}
          onChange={(event) => handlePositionChange('x')(Number(event.target.value))}
          className="w-full accent-white"
        />
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Vertical</span>
          <span className="text-white">{positionSlider.y.toFixed(0)}</span>
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={positionSlider.y}
          onChange={(event) => handlePositionChange('y')(Number(event.target.value))}
          className="w-full accent-white"
        />
      </div>
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={fitImageToCanvas}
          className="flex-1 rounded-2xl border border-white/20 px-3 py-2 font-semibold text-white transition hover:border-white/40"
        >
          Auto Fit
        </button>
        <button
          type="button"
          onClick={() => updateTransform({ x: 0, y: 0 })}
          className="flex-1 rounded-2xl border border-white/20 px-3 py-2 font-semibold text-white transition hover:border-white/40"
        >
          Recenter
        </button>
      </div>
      <div className="space-y-2 text-xs">
        <ToggleButton
          label="Center Snap"
          active={centerSnap}
          onClick={() => setCenterSnap(!centerSnap)}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => adjustScale(1.05)}
          className="rounded-full border border-white/10 px-3 py-1 text-white transition hover:border-white/40"
        >
          + Zoom
        </button>
        <button
          type="button"
          onClick={() => adjustScale(0.95)}
          className="rounded-full border border-white/10 px-3 py-1 text-white transition hover:border-white/40"
        >
          − Zoom
        </button>
        <button
          type="button"
          onClick={resetTransform}
          className="ml-auto rounded-full bg-white/10 px-4 py-1 font-semibold text-white transition hover:bg-white/20"
        >
          Reset
        </button>
      </div>
    </PanelSection>
  )
}
