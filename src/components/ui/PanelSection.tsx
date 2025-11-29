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
    <section className={`space-y-4 rounded-2xl border border-white/10 bg-canvas-control/80 backdrop-blur p-4 text-sm text-slate-200 ${className}`}>
      <header>
        <p className="text-base font-semibold text-white">{title}</p>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </header>
      {children}
    </section>
  )
}

