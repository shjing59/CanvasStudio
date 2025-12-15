# Mobile Bottom Toolbar Implementation Plan

## Overview
Transform the mobile experience from a right-side drawer to a bottom toolbar interface, similar to modern photo editing apps (VSCO, Lightroom Mobile). This plan maintains all existing functionality while improving mobile UX.

## Design Requirements

### 1. Gridlines Behind Canvas
- **Location**: `src/components/workspace/Workspace.tsx`
- **Current**: Checkerboard pattern (light gray squares)
- **Change**: Add subtle gridlines overlay (like in preview)
- **Implementation**: 
  - Add a new grid pattern using CSS gradients
  - Use subtle white/transparent lines (rgba(255,255,255,0.02))
  - Grid size: 20px x 20px (matching preview)
  - Position: Behind canvas, above checkerboard or replace checkerboard

### 2. Bottom Toolbar Structure
- **New Component**: `src/components/navigation/MobileBottomToolbar.tsx`
- **Replaces**: Right drawer on mobile (keep desktop drawer unchanged)
- **Layout**:
  - Fixed at bottom with safe area insets
  - Dark translucent background with backdrop blur
  - Tab navigation at top (horizontal scrollable)
  - Tab content area below tabs
  - Height: ~200-250px when expanded (adjustable per tab)

### 3. Tab Organization
Tabs should contain:
1. **Filters** - Horizontal scrollable filter previews
2. **Ratio** - Existing ratio controls (preset buttons + custom inputs)
3. **Crop** - Existing crop controls (aspect presets + action buttons)
4. **Transform** - Existing transform controls (sliders + buttons)
5. **Background** - Existing background color controls
6. **Border** - Existing border controls

### 4. Filter Preview Implementation

#### 4.1 Filter Preview Component
- **New Component**: `src/components/filters/FilterPreview.tsx`
- **Purpose**: Display circular filter preview thumbnails
- **Features**:
  - Circular preview (80px diameter)
  - Shows filter applied to a sample image
  - Active state with white border and shadow
  - Filter name label below
  - Horizontal scrollable container

#### 4.2 Sample Image for Previews
- **Options**:
  1. Use a built-in sample image (bundled with app)
  2. Use the active image (if available) - preferred
  3. Use a default placeholder
- **Implementation Strategy**:
  - If active image exists: Generate previews using active image
  - If no image: Show placeholder or disable filter selection
  - Cache preview thumbnails to avoid regeneration

#### 4.3 Preview Generation
- **New Utility**: `src/lib/filters/previewGenerator.ts`
- **Function**: Generate small thumbnail previews (80x80px) with filters applied
- **Process**:
  1. Take source image (active image or sample)
  2. Resize to 80x80px (maintain aspect ratio, crop to square)
  3. Apply filter at full intensity
  4. Convert to data URL for `<img>` src
  5. Cache results by (imageId + filterId)
- **Performance**:
  - Generate on-demand (lazy load)
  - Cache in memory (Map<string, string>)
  - Use Web Workers if needed for heavy processing
  - Debounce rapid filter changes

#### 4.4 Filter Panel Mobile Version
- **Modify**: `src/components/controls/FilterPanel.tsx`
- **Add**: Mobile-specific rendering
- **Mobile Layout**:
  - Horizontal scrollable filter previews
  - Intensity slider below previews
  - Remove dropdown select (replace with preview selection)
  - Keep file upload button (maybe in a separate section)

### 5. Component Modifications

#### 5.1 Workspace Component
**File**: `src/components/workspace/Workspace.tsx`
- Add gridlines pattern (CSS background)
- Keep checkerboard or replace with gridlines
- Ensure proper z-index layering

#### 5.2 Right Drawer
**File**: `src/components/drawers/RightDrawer.tsx`
- Hide on mobile (when bottom toolbar is active)
- Keep desktop functionality unchanged
- Remove mobile-specific drawer logic

#### 5.3 Mobile Navigation
**File**: `src/components/navigation/MobileNav.tsx`
- Keep Import and Export buttons
- Remove or modify Controls button (toolbar always visible or toggle)
- Adjust layout to accommodate bottom toolbar

#### 5.4 Control Panels
All panel components need mobile-aware rendering:
- **RatioPanel**: Horizontal preset buttons + compact custom inputs
- **CropPanel**: Horizontal aspect buttons + action buttons
- **TransformPanel**: Compact sliders + icon buttons
- **BackgroundPanel**: Horizontal color swatches
- **BorderPanel**: Compact number inputs + unit selectors

### 6. State Management

#### 6.1 Active Tab State
- **Store**: `src/state/canvasStore.ts`
- **Add**: `mobileToolbarActiveTab: string | null`
- **Actions**: `setMobileToolbarActiveTab(tab: string)`

#### 6.2 Filter Preview Cache
- **Store**: Component-level or global cache
- **Structure**: `Map<imageId-filterId, dataURL>`
- **Invalidation**: When image changes or filter updates

### 7. Responsive Behavior

#### 7.1 Breakpoint Strategy
- **Mobile** (< 768px): Bottom toolbar active
- **Desktop** (≥ 768px): Right drawer active (unchanged)
- Use existing `useResponsive` hook

#### 7.2 Toolbar Visibility
- **Options**:
  1. Always visible (fixed at bottom)
  2. Toggleable (expand/collapse button)
  3. Auto-hide on scroll (if canvas is scrollable)
- **Recommendation**: Always visible for quick access

### 8. File Structure

```
src/
├── components/
│   ├── navigation/
│   │   ├── MobileNav.tsx (modify)
│   │   └── MobileBottomToolbar.tsx (new)
│   ├── filters/
│   │   └── FilterPreview.tsx (new)
│   ├── controls/
│   │   ├── FilterPanel.tsx (modify - add mobile layout)
│   │   ├── RatioPanel.tsx (modify - add mobile layout)
│   │   ├── CropPanel.tsx (modify - add mobile layout)
│   │   ├── TransformPanel.tsx (modify - add mobile layout)
│   │   ├── BackgroundPanel.tsx (modify - add mobile layout)
│   │   └── BorderPanel.tsx (modify - add mobile layout)
│   └── workspace/
│       └── Workspace.tsx (modify - add gridlines)
├── lib/
│   └── filters/
│       └── previewGenerator.ts (new)
└── state/
    └── canvasStore.ts (modify - add toolbar state)
```

### 9. Implementation Steps

#### Phase 1: Foundation
1. Add gridlines to Workspace component
2. Create MobileBottomToolbar component structure
3. Add tab navigation system
4. Integrate with responsive hook

#### Phase 2: Filter Previews
1. Create FilterPreview component
2. Implement preview generation utility
3. Add preview caching mechanism
4. Integrate with FilterPanel

#### Phase 3: Control Panels Mobile Layout
1. Modify each control panel for mobile layout
2. Create mobile-specific rendering logic
3. Test each panel in bottom toolbar context
4. Ensure all functionality preserved

#### Phase 4: Integration
1. Hide right drawer on mobile
2. Show bottom toolbar on mobile
3. Update MobileNav layout
4. Test responsive behavior

#### Phase 5: Polish
1. Add smooth transitions
2. Optimize performance (lazy loading, caching)
3. Test on various mobile devices
4. Handle edge cases (no image, loading states)

### 10. Technical Considerations

#### 10.1 Performance
- **Filter Preview Generation**: Expensive operation
  - Use requestAnimationFrame for batching
  - Generate previews on-demand (not all at once)
  - Cache aggressively
  - Consider Web Workers for heavy processing

#### 10.2 Memory Management
- **Preview Cache**: Limit cache size (LRU eviction)
- **Image Handling**: Dispose of unused canvas elements
- **Event Listeners**: Clean up properly

#### 10.3 Accessibility
- **Keyboard Navigation**: Tab through filter previews
- **Screen Readers**: Proper ARIA labels
- **Touch Targets**: Minimum 44x44px for mobile

#### 10.4 Safe Areas
- **Notched Devices**: Account for safe area insets
- **Home Indicator**: Padding at bottom
- **Status Bar**: No overlap issues

### 11. Testing Checklist

- [ ] Gridlines visible behind canvas
- [ ] Bottom toolbar appears on mobile (< 768px)
- [ ] Right drawer hidden on mobile
- [ ] All tabs functional
- [ ] Filter previews generate correctly
- [ ] Filter selection works
- [ ] Ratio controls work
- [ ] Crop controls work
- [ ] Transform controls work
- [ ] Background color selection works
- [ ] Border controls work
- [ ] Intensity slider works
- [ ] Preview caching works
- [ ] Performance acceptable (no lag)
- [ ] Safe area insets respected
- [ ] Desktop layout unchanged
- [ ] Responsive breakpoints correct

### 12. Design Specifications

#### 12.1 Bottom Toolbar
- **Background**: `rgba(20, 20, 20, 0.95)` with `backdrop-filter: blur(20px)`
- **Border**: `1px solid rgba(255, 255, 255, 0.1)` on top
- **Height**: Dynamic based on active tab content
- **Padding**: `12px 16px` + safe area insets
- **Z-index**: High enough to overlay canvas (z-50)

#### 12.2 Filter Previews
- **Size**: 80px diameter circles
- **Border**: `2px solid rgba(255, 255, 255, 0.2)`
- **Active Border**: `3px solid #fff` with shadow
- **Spacing**: 12px gap between items
- **Label**: 11px font, max-width 80px, ellipsis overflow

#### 12.3 Tabs
- **Height**: ~40px
- **Padding**: `8px 16px`
- **Border Radius**: `20px`
- **Active State**: White background with border
- **Inactive State**: Transparent with subtle border

#### 12.4 Gridlines
- **Color**: `rgba(255, 255, 255, 0.02)`
- **Size**: 20px x 20px grid
- **Pattern**: Horizontal and vertical lines
- **Position**: Behind canvas, above workspace background

### 13. Migration Strategy

1. **Non-Breaking**: Desktop layout remains unchanged
2. **Feature Flags**: Consider feature flag for gradual rollout
3. **Backward Compatible**: All existing functionality preserved
4. **Progressive Enhancement**: Mobile gets enhanced UX, desktop stays same

### 14. Future Enhancements

- Swipe gestures between tabs
- Pinch to zoom on filter previews
- Long-press for filter details
- Filter favorites/recents
- Custom filter preview images
- Animation transitions between tabs

## Notes

- All existing functionality must be preserved
- Desktop experience should remain unchanged
- Mobile experience should feel native and responsive
- Performance is critical for filter preview generation
- Accessibility must be maintained

