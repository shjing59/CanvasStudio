import { useCanvasStore } from '../../state/canvasStore'

// Panel for selecting canvas background color
export const BackgroundPanel = () => {
  const background = useCanvasStore((state) => state.background)
  const setBackground = useCanvasStore((state) => state.setBackground)

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-canvas-control/80 backdrop-blur p-4 text-sm text-slate-200">
      <header>
        <p className="text-base font-semibold text-white">Canvas Background</p>
        <p className="text-xs text-slate-400">Choose the background color for your canvas</p>
      </header>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Color</span>
          <div className="relative">
            <input
              type="color"
              value={background}
              onChange={(event) => setBackground(event.target.value)}
              className="h-10 w-20 cursor-pointer rounded-lg border border-white/10 bg-white/5"
              style={{ backgroundColor: background }}
            />
          </div>
        </label>
        <input
          type="text"
          value={background}
          onChange={(event) => setBackground(event.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
          placeholder="#ffffff"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'White', value: '#ffffff' },
          { label: 'Black', value: '#000000' },
          { label: 'Light Gray', value: '#f5f5f5' },
          { label: 'Dark Gray', value: '#333333' },
        ].map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setBackground(preset.value)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              background === preset.value
                ? 'border-white bg-white/10 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  )
}

