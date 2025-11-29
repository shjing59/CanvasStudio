import { BackgroundPanel } from './BackgroundPanel'
import { BorderPanel } from './BorderPanel'
import { ExportPanel } from './ExportPanel'
import { ImportPanel } from './ImportPanel'
import { RatioPanel } from './RatioPanel'
import { TransformPanel } from './TransformPanel'

// High-level shell that orders the individual control groups.
export const ControlPanel = () => (
  <aside className="flex w-full flex-col gap-4">
    <ImportPanel />
    <RatioPanel />
    <TransformPanel />
    <BackgroundPanel />
    <BorderPanel />
    <ExportPanel />
  </aside>
)

