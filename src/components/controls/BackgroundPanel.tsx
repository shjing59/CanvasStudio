import { useCanvasStore } from '../../state/canvasStore'
import { PanelSection } from '../ui/PanelSection'
import { PresetButtons } from '../ui/PresetButtons'
import { BACKGROUND_COLORS } from '../../constants/presets'

// Panel for selecting canvas background color
export const BackgroundPanel = () => {
  const background = useCanvasStore((state) => state.background)
  const setBackground = useCanvasStore((state) => state.setBackground)

  return (
    <PanelSection 
      title="Canvas Background" 
      description="Choose the background color for your canvas"
    >
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Color</span>
          <div className="relative">
            <input
              type="color"
              value={background}
              onChange={(event) => setBackground(event.target.value)}
              className="h-10 w-20 cursor-pointer rounded-lg border border-white/10 bg-white/5"
              style={{ backgroundColor: background }}
            />
          </div>
        </label>
        <input
          type="text"
          value={background}
          onChange={(event) => setBackground(event.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
          placeholder="#ffffff"
        />
      </div>
      <PresetButtons
        presets={BACKGROUND_COLORS}
        currentValue={background}
        onChange={setBackground}
      />
    </PanelSection>
  )
}
