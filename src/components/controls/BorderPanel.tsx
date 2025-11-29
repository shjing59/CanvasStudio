import { useCanvasStore } from '../../state/canvasStore'

type BorderKey = 'top' | 'bottom'

// Implements the bespoke top/bottom border workflow outlined in the brief.
export const BorderPanel = () => {
  const borders = useCanvasStore((state) => state.borders)
  const setBorders = useCanvasStore((state) => state.setBorders)

  const handleValueChange = (key: BorderKey, value: number) => {
    setBorders({
      [key]: { ...borders[key], value },
    })
  }

  const handleUnitChange = (key: BorderKey, unit: 'px' | 'percent') => {
    setBorders({
      [key]: { ...borders[key], unit },
    })
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-canvas-control/80 backdrop-blur p-4 text-sm text-slate-200">
      <header>
        <p className="text-base font-semibold text-white">3. Top / Bottom Borders</p>
        <p className="text-xs text-slate-400">
          Frame-room auto scales while preserving your custom positioning.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <BorderField
          label="Top"
          value={borders.top.value}
          unit={borders.top.unit}
          onValueChange={(value) => handleValueChange('top', value)}
          onUnitChange={(unit) => handleUnitChange('top', unit)}
        />
        <BorderField
          label="Bottom"
          value={borders.bottom.value}
          unit={borders.bottom.unit}
          onValueChange={(value) => handleValueChange('bottom', value)}
          onUnitChange={(unit) => handleUnitChange('bottom', unit)}
        />
      </div>
      <p className="text-xs text-slate-500">
        Auto-scale keeps object-fit cover intact. Toggle Auto Fit to recenter between borders.
      </p>
    </section>
  )
}

interface BorderFieldProps {
  label: string
  value: number
  unit: 'px' | 'percent'
  onValueChange: (value: number) => void
  onUnitChange: (unit: 'px' | 'percent') => void
}

const BorderField = ({ label, value, unit, onValueChange, onUnitChange }: BorderFieldProps) => (
  <label className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-3">
    <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onValueChange(Number(event.target.value))}
        className="w-full rounded-lg border border-white/10 bg-canvas-accent/40 px-2 py-1 text-white focus:border-white/40 focus:outline-none"
      />
      <select
        value={unit}
        onChange={(event) => onUnitChange(event.target.value as 'px' | 'percent')}
        className="rounded-lg border border-white/10 bg-canvas-accent/40 px-2 py-1 text-white focus:border-white/40 focus:outline-none"
      >
        <option value="px">px</option>
        <option value="percent">%</option>
      </select>
    </div>
  </label>
)

