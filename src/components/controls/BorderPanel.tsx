import { useCanvasStore } from '../../state/canvasStore'
import { useResponsive } from '../../hooks/useResponsive'

type BorderKey = 'top' | 'bottom'

// Implements the bespoke top/bottom border workflow outlined in the brief.
export const BorderPanel = () => {
  const { isMobile } = useResponsive()
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

  const content = (
    <>
      <div className="grid grid-cols-2 gap-3 text-xs min-w-0">
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
      {!isMobile && (
        <p className="text-xs text-slate-500 break-words">
          Auto-scale keeps object-fit cover intact. Toggle Auto Fit to recenter between borders.
        </p>
      )}
    </>
  )

  if (isMobile) {
    return <div className="space-y-3">{content}</div>
  }

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-canvas-control/80 backdrop-blur p-4 text-sm text-slate-200 min-w-0">
      <header className="min-w-0">
        <p className="text-base font-semibold text-white break-words">3. Top / Bottom Borders</p>
        <p className="text-xs text-slate-400 break-words">
          Frame-room auto scales while preserving your custom positioning.
        </p>
      </header>
      {content}
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
  <label className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-3 min-w-0">
    <span className="text-xs uppercase tracking-wide text-slate-400 truncate">{label}</span>
    <div className="flex items-center gap-2 min-w-0">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onValueChange(Number(event.target.value))}
        className="w-full min-w-0 rounded-lg border border-white/10 bg-canvas-accent/40 px-2 py-1 text-white focus:border-white/40 focus:outline-none"
      />
      <select
        value={unit}
        onChange={(event) => onUnitChange(event.target.value as 'px' | 'percent')}
        className="rounded-lg border border-white/10 bg-canvas-accent/40 px-2 py-1 text-white focus:border-white/40 focus:outline-none flex-shrink-0"
      >
        <option value="px">px</option>
        <option value="percent">%</option>
      </select>
    </div>
  </label>
)

