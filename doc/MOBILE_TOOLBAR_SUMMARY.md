# Mobile Bottom Toolbar - Implementation Summary

## What We're Building

A mobile-first bottom toolbar interface that replaces the right-side drawer on mobile devices, featuring:

1. **Gridlines** behind the canvas (subtle overlay)
2. **Filter previews** as horizontal scrollable circles
3. **All existing controls** (Ratio, Crop, Transform, Background, Border) in tabbed interface

## Key Design Elements

### Gridlines
```
Workspace Background
├── Checkerboard pattern (existing)
└── Gridlines overlay (new)
    └── 20px x 20px grid
    └── rgba(255,255,255,0.02) lines
```

### Bottom Toolbar Structure
```
┌─────────────────────────────────────┐
│  [Filters] [Ratio] [Crop] [Transform] │ ← Tabs (scrollable)
├─────────────────────────────────────┤
│                                     │
│  Filter Previews (horizontal scroll)│
│  ○ ○ ○ ○ ○ ○ ○ ○                   │
│                                     │
│  Intensity Slider                   │
└─────────────────────────────────────┘
```

### Filter Preview Item
```
     ┌─────┐
     │  ○  │  ← 80px circle with filter applied
     └─────┘
   Filter Name
```

## Component Architecture

### New Components
1. **MobileBottomToolbar.tsx** - Main toolbar container
2. **FilterPreview.tsx** - Individual filter preview circle
3. **previewGenerator.ts** - Utility to generate filter preview thumbnails

### Modified Components
1. **Workspace.tsx** - Add gridlines
2. **RightDrawer.tsx** - Hide on mobile
3. **MobileNav.tsx** - Adjust layout
4. **All Control Panels** - Add mobile layouts

## Data Flow

### Filter Preview Generation
```
Active Image (or sample.jpg)
    ↓
Resize to 80x80px (square crop)
    ↓
Apply Filter (full intensity)
    ↓
Convert to Data URL
    ↓
Cache (imageId + filterId)
    ↓
Display in FilterPreview component
```

## Implementation Phases

### Phase 1: Visual Foundation ✅
- [ ] Add gridlines to Workspace
- [ ] Create MobileBottomToolbar shell
- [ ] Set up tab navigation

### Phase 2: Filter Previews ⭐
- [ ] Create FilterPreview component
- [ ] Build preview generator utility
- [ ] Implement caching
- [ ] Integrate with FilterPanel

### Phase 3: Control Panels
- [ ] Mobile layouts for each panel
- [ ] Preserve all functionality
- [ ] Test each control

### Phase 4: Integration
- [ ] Hide right drawer on mobile
- [ ] Show toolbar on mobile
- [ ] Update navigation

### Phase 5: Polish
- [ ] Performance optimization
- [ ] Smooth animations
- [ ] Edge case handling

## Technical Highlights

### Performance Optimizations
- **Lazy Loading**: Generate previews on-demand
- **Caching**: Store previews in memory (Map)
- **Batching**: Use requestAnimationFrame
- **Debouncing**: Prevent rapid regeneration

### Responsive Strategy
- **Mobile** (< 768px): Bottom toolbar
- **Desktop** (≥ 768px): Right drawer (unchanged)

### Sample Image Strategy
1. **Primary**: Use active image (if available)
2. **Fallback**: Use `/public/sample.jpg`
3. **Placeholder**: Show disabled state if no image

## File Changes Overview

```
Modified:
├── src/components/workspace/Workspace.tsx
├── src/components/drawers/RightDrawer.tsx
├── src/components/navigation/MobileNav.tsx
├── src/components/controls/FilterPanel.tsx
├── src/components/controls/RatioPanel.tsx
├── src/components/controls/CropPanel.tsx
├── src/components/controls/TransformPanel.tsx
├── src/components/controls/BackgroundPanel.tsx
├── src/components/controls/BorderPanel.tsx
└── src/state/canvasStore.ts

New:
├── src/components/navigation/MobileBottomToolbar.tsx
├── src/components/filters/FilterPreview.tsx
└── src/lib/filters/previewGenerator.ts
```

## Key Features Preserved

✅ All ratio controls (presets + custom)
✅ All crop controls (aspect + actions)
✅ All transform controls (position + scale)
✅ All background color options
✅ All border controls
✅ Filter intensity slider
✅ Custom filter upload

## Design Specifications

### Colors & Styling
- **Toolbar BG**: `rgba(20, 20, 20, 0.95)` + blur
- **Active Tab**: White background, white border
- **Filter Preview**: 80px circle, 2px border
- **Active Filter**: 3px white border + shadow
- **Gridlines**: `rgba(255,255,255,0.02)`

### Spacing
- **Tab Padding**: `8px 16px`
- **Filter Gap**: `12px`
- **Toolbar Padding**: `12px 16px` + safe area

### Typography
- **Filter Labels**: 11px, ellipsis overflow
- **Tab Labels**: 13px, medium weight

## Success Criteria

- [x] Gridlines visible and subtle
- [ ] Bottom toolbar appears on mobile
- [ ] Filter previews show actual filter effects
- [ ] All controls functional
- [ ] Performance acceptable (< 100ms per preview)
- [ ] Desktop layout unchanged
- [ ] Safe areas respected

## Next Steps

1. Review this plan
2. Start with Phase 1 (gridlines + toolbar shell)
3. Implement filter previews (most complex part)
4. Migrate control panels
5. Test thoroughly on mobile devices

