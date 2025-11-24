import { useExportImage } from '../hooks/useExportImage'
import { useCanvasStore } from '../state/canvasStore'

// Mobile-first toolbar that keeps the most common toggles within thumb reach.
export const BottomToolbar = () => {
  const centerSnap = useCanvasStore((state) => state.centerSnap)
  const setCenterSnap = useCanvasStore((state) => state.setCenterSnap)
  const autoFit = useCanvasStore((state) => state.autoFit)
  const setAutoFit = useCanvasStore((state) => state.setAutoFit)
  const { exportImage, isExporting } = useExportImage()

  return (
    <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-canvas-control/80 p-3 text-xs backdrop-blur">
      <ToolbarToggle
        label="Center Snap"
        active={centerSnap}
        onClick={() => setCenterSnap(!centerSnap)}
      />
      <ToolbarToggle label="Auto Fit" active={autoFit} onClick={() => setAutoFit(!autoFit)} />
      <button
        type="button"
        onClick={exportImage}
        disabled={isExporting}
        className="ml-auto rounded-full bg-white px-5 py-2 font-semibold text-black disabled:bg-white/40"
      >
        {isExporting ? 'Exporting…' : 'Export'}
      </button>
    </div>
  )
}

const ToolbarToggle = ({
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
    className={`rounded-full border px-4 py-2 font-semibold ${
      active ? 'border-white bg-white/10 text-white' : 'border-white/10 text-slate-400'
    }`}
  >
    {label}
  </button>
)

