interface PresetButtonsProps<T> {
  presets: readonly { label: string; value: T }[]
  currentValue: T
  onChange: (value: T) => void
  className?: string
}

/**
 * Reusable component for rendering preset selection buttons
 */
export const PresetButtons = <T,>({
  presets,
  currentValue,
  onChange,
  className = '',
}: PresetButtonsProps<T>) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((preset) => (
        <button
          key={String(preset.value)}
          type="button"
          onClick={() => onChange(preset.value)}
          className={`rounded-full border px-4 py-1 text-xs font-medium transition ${
            currentValue === preset.value
              ? 'border-white bg-white/20 text-white'
              : 'border-white/10 text-slate-300 hover:border-white/40'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}

