import { MAX_SCALE } from '../../lib/canvas/math'
import { selectMinimumScale, useCanvasStore } from '../../state/canvasStore'

// Gives fine-grained control over scale toggles + center snapping + reset flows.
export const TransformPanel = () => {
  const transform = useCanvasStore((state) => state.transform)
  const adjustScale = useCanvasStore((state) => state.adjustScale)
  const setScale = useCanvasStore((state) => state.setScale)
  const resetTransform = useCanvasStore((state) => state.resetTransform)
  const centerSnap = useCanvasStore((state) => state.centerSnap)
  const setCenterSnap = useCanvasStore((state) => state.setCenterSnap)
  const autoFit = useCanvasStore((state) => state.autoFit)
  const setAutoFit = useCanvasStore((state) => state.setAutoFit)
  const minScale = useCanvasStore(selectMinimumScale)

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
          <span className="text-white">{(transform.scale * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min={minScale}
          max={MAX_SCALE}
          step={0.01}
          value={transform.scale}
          onChange={(event) => setScale(Number(event.target.value))}
          className="w-full accent-white"
        />
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

