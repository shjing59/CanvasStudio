import { BackgroundPanel } from './BackgroundPanel'
import { BorderPanel } from './BorderPanel'
import { CropPanel } from './CropPanel'
import { ExportSettingsPanel } from './ExportSettingsPanel'
import { RatioPanel } from './RatioPanel'
import { TransformPanel } from './TransformPanel'

// High-level shell that orders the individual control groups.
// Import and Export actions are now in TopToolbar for better UX.
export const ControlPanel = () => (
  <aside className="flex w-full flex-col gap-4">
    <RatioPanel />
    <CropPanel />
    <TransformPanel />
    <BackgroundPanel />
    <BorderPanel />
    <ExportSettingsPanel />
  </aside>
)

