import { BackgroundPanel } from './BackgroundPanel'
import { CropPanel } from './CropPanel'
import { FilterPanel } from './FilterPanel'
import { RatioPanel } from './RatioPanel'
import { TransformPanel } from './TransformPanel'

// High-level shell that orders the individual control groups.
// Import and Export actions are now in LeftDrawer.
export const ControlPanel = () => (
  <aside className="flex w-full flex-col gap-4 min-w-0">
    <RatioPanel />
    <CropPanel />
    <TransformPanel />
    <FilterPanel />
    <BackgroundPanel />
  </aside>
)

