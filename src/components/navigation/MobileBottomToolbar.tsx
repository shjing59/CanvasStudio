import { useState } from 'react'
import { useResponsive } from '../../hooks/useResponsive'
import { useCanvasStore } from '../../state/canvasStore'
import { FilterPanel } from '../controls/FilterPanel'
import { RatioPanel } from '../controls/RatioPanel'
import { CropPanel } from '../controls/CropPanel'
import { TransformPanel } from '../controls/TransformPanel'
import { BackgroundPanel } from '../controls/BackgroundPanel'

type TabId = 'filters' | 'ratio' | 'crop' | 'transform' | 'background'

interface Tab {
  id: TabId
  label: string
}

const TABS: Tab[] = [
  { id: 'ratio', label: 'Ratio' },
  { id: 'crop', label: 'Crop' },
  { id: 'transform', label: 'Transform' },
  { id: 'filters', label: 'Filters' },
  { id: 'background', label: 'Background' },
]

/**
 * Mobile bottom toolbar - editing controls panel for mobile devices.
 * Contains all canvas control panels in a tabbed interface.
 * Slides up from bottom when opened, positioned above the bottom nav.
 */
export const MobileBottomToolbar = () => {
  const { isMobile } = useResponsive()
  const mobileToolbarOpen = useCanvasStore((state) => state.mobileToolbarOpen)
  const [activeTab, setActiveTab] = useState<TabId>('filters')

  // Don't render on desktop
  if (!isMobile) return null

  // Don't render if closed
  if (!mobileToolbarOpen) return null

  const renderTabContent = () => {
    switch (activeTab) {
      case 'filters':
        return <FilterPanel />
      case 'ratio':
        return <RatioPanel />
      case 'crop':
        return <CropPanel />
      case 'transform':
        return <TransformPanel />
      case 'background':
        return <BackgroundPanel />
      default:
        return null
    }
  }

  return (
    <div
      className="fixed left-0 right-0 z-40 bg-[rgba(20,20,20,0.95)] backdrop-blur-[20px] border-t border-white/10 transition-transform duration-300 ease-in-out"
      style={{
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', // Position above bottom nav
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: mobileToolbarOpen ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-[20px] text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/5 text-slate-400 border border-transparent hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
        <div className="min-w-0">{renderTabContent()}</div>
      </div>
    </div>
  )
}

