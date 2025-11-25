import { useMemo } from 'react'
import { useCanvasStore } from '../../state/canvasStore'

// Gives fine-grained control over scale toggles + center snapping + reset flows.
export const TransformPanel = () => {
  const transform = useCanvasStore((state) => state.transform)
  const adjustScale = useCanvasStore((state) => state.adjustScale)
  const resetTransform = useCanvasStore((state) => state.resetTransform)
  const centerSnap = useCanvasStore((state) => state.centerSnap)
  const setCenterSnap = useCanvasStore((state) => state.setCenterSnap)
  const autoFit = useCanvasStore((state) => state.autoFit)
  const setAutoFit = useCanvasStore((state) => state.setAutoFit)
  const previewSize = useCanvasStore((state) => state.previewSize)
  const image = useCanvasStore((state) => state.image)
  const updateTransform = useCanvasStore((state) => state.updateTransform)
  const imageScale = useCanvasStore((state) => state.imageScale)
  const setImageScale = useCanvasStore((state) => state.setImageScale)
  const keepAspectRatio = useCanvasStore((state) => state.keepAspectRatio)
  const setKeepAspectRatio = useCanvasStore((state) => state.setKeepAspectRatio)
  const fitImageToCanvas = useCanvasStore((state) => state.fitImageToCanvas)

  const fitScale = useMemo(() => {
    if (!image || !previewSize) return null
    if (!image.width || !image.height || !previewSize.width || !previewSize.height) return null
    return Math.min(previewSize.width / image.width, previewSize.height / image.height)
  }, [image, previewSize])

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

  const naturalWidth = image?.width || imageScale.width || 0
  const naturalHeight = image?.height || imageScale.height || 0
  const currentWidth = imageScale.width || naturalWidth
  const currentHeight = imageScale.height || naturalHeight

  const handleWidthChange = (value: string) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    let nextHeight = currentHeight
    if (keepAspectRatio && naturalWidth > 0) {
      nextHeight = Math.round((parsed / naturalWidth) * naturalHeight)
    }
    setImageScale({ width: parsed, height: nextHeight })
  }

  const handleHeightChange = (value: string) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    let nextWidth = currentWidth
    if (keepAspectRatio && naturalHeight > 0) {
      nextWidth = Math.round((parsed / naturalHeight) * naturalWidth)
    }
    setImageScale({ height: parsed, width: nextWidth })
  }

  return (
    <section className="space-y-4 rounded-2xl bg-canvas-control/60 p-4 text-sm text-slate-200 shadow-inner shadow-black/20">
      <header>
        <p className="text-base font-semibold text-white">3. Position & Scale</p>
        <p className="text-xs text-slate-400">
          Drag to move. Wheel, pinch, or Shift + Drag to scale.
        </p>
      </header>
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
      <div className="space-y-2 rounded-2xl border border-white/10 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Custom Width</span>
          <span className="text-white">{currentWidth}px</span>
        </div>
        <input
          type="number"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white"
          value={currentWidth}
          min={1}
          onChange={(event) => handleWidthChange(event.target.value)}
        />
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Custom Height</span>
          <span className="text-white">{currentHeight}px</span>
        </div>
        <input
          type="number"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white"
          value={currentHeight}
          min={1}
          onChange={(event) => handleHeightChange(event.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={keepAspectRatio}
            onChange={(event) => setKeepAspectRatio(event.target.checked)}
          />
          Lock aspect ratio
        </label>
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
      <div className="grid grid-cols-2 gap-3 text-xs">
        <ToggleButton
          label="Center Snap"
          active={centerSnap}
          onClick={() => setCenterSnap(!centerSnap)}
        />
        <ToggleButton label="Auto Fit" active={autoFit} onClick={() => setAutoFit(!autoFit)} />
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
          Reset (R)
        </button>
      </div>
    </section>
  )
}

const ToggleButton = ({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border px-3 py-2 font-medium transition ${
      active ? 'border-white bg-white/10 text-white' : 'border-white/10 text-slate-300'
    }`}
  >
    {label}
  </button>
)

