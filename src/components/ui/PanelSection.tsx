interface PanelSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Consistent panel section styling for all control panels
 */
export const PanelSection = ({ title, description, children, className = '' }: PanelSectionProps) => {
  return (
    <section className={`space-y-4 rounded-2xl border border-white/10 bg-canvas-control/80 backdrop-blur p-4 text-sm text-slate-200 min-w-0 ${className}`}>
      <header className="min-w-0">
        <p className="text-base font-semibold text-white break-words">{title}</p>
        {description && <p className="text-xs text-slate-400 break-words">{description}</p>}
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

