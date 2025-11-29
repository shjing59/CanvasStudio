import { useMemo } from 'react'
import { RATIO_PRESETS } from '../../lib/canvas/ratios'
import { useCanvasStore } from '../../state/canvasStore'

// Switches between preset, original, and custom canvas ratios.
export const RatioPanel = () => {
  const ratioId = useCanvasStore((state) => state.ratioId)
  const image = useCanvasStore((state) => state.image)
  const setRatio = useCanvasStore((state) => state.setRatio)
  const customRatio = useCanvasStore((state) => state.customRatio)
  const setCustomRatio = useCanvasStore((state) => state.setCustomRatio)

  const ratioButtons = useMemo(
    () =>
      RATIO_PRESETS.filter((ratio) => (ratio.id === 'original' ? Boolean(image) : true)),
    [image]
  )

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-canvas-control/80 backdrop-blur p-4 text-sm text-slate-200">
      <header>
        <p className="text-base font-semibold text-white">1. Canvas Ratio</p>
        <p className="text-xs text-slate-400">Switch instantly while preserving layout</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {ratioButtons.map((ratio) => (
          <button
            key={ratio.id}
            type="button"
            onClick={() => setRatio(ratio.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              ratio.id === ratioId
                ? 'border-white bg-white/10 text-white'
                : 'border-white/10 text-slate-300 hover:border-white/30'
            }`}
          >
            {ratio.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">Custom width</span>
          <input
            type="number"
            min={1}
            value={customRatio.width}
            onChange={(event) =>
              setCustomRatio({ width: Number(event.target.value), height: customRatio.height })
            }
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white focus:border-white/40 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">Custom height</span>
          <input
            type="number"
            min={1}
            value={customRatio.height}
            onChange={(event) =>
              setCustomRatio({ width: customRatio.width, height: Number(event.target.value) })
            }
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white focus:border-white/40 focus:outline-none"
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Custom values auto-apply once both width and height are defined.
      </p>
    </section>
  )
}

