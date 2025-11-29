interface ToggleButtonProps {
  label: string
  active: boolean
  onClick: () => void
  className?: string
}

/**
 * Reusable toggle button component for binary state controls
 */
export const ToggleButton = ({ label, active, onClick, className = '' }: ToggleButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2 font-medium transition ${
        active ? 'border-white bg-white/10 text-white' : 'border-white/10 text-slate-300'
      } ${className}`}
    >
      {label}
    </button>
  )
}

