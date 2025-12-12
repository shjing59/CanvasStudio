# Mobile Layout Strategy

## Current Layout Analysis

### Desktop Layout (Current)
```
┌─────────────────────────────────────────────────────────┐
│  Left Drawer (300px) │  Canvas Area  │  Right Drawer (350px) │
│  [Import/Export]     │  [Main Work] │  [Controls]          │
└─────────────────────────────────────────────────────────┘
```

**Issues for Mobile:**
1. **Fixed margins break on small screens**: `marginLeft: 300px` + `marginRight: 350px` = 650px minimum, but mobile screens are ~375-414px wide
2. **Drawers too wide**: 300px + 350px drawers would take up entire screen
3. **Toggle buttons overlap**: Fixed position buttons at screen edges may conflict with canvas
4. **Canvas sizing**: Uses 80% of viewport but doesn't account for drawer margins on mobile
5. **No mobile-specific behavior**: Drawers behave the same on all screen sizes

## Proposed Mobile Layout Strategy

### Breakpoint Strategy
- **Mobile**: `< 768px` (sm breakpoint)
- **Tablet**: `768px - 1024px` (md breakpoint)  
- **Desktop**: `≥ 1024px` (lg breakpoint)

### Mobile Layout Behavior

#### 1. Drawer Behavior
**Mobile (< 768px):**
- Drawers become **full-screen overlays** (not sidebars)
- Only **one drawer open at a time** (opening one closes the other)
- Drawers slide in from their respective sides
- Canvas area uses **full viewport** when drawers are closed
- **Backdrop overlay** (semi-transparent) behind drawer to indicate modal state
- **Swipe gestures** to close drawers (optional enhancement)

**Tablet (768px - 1024px):**
- Drawers can be **sidebars or overlays** (user preference or auto-detect)
- Can have both open if screen width allows
- Reduced drawer widths (250px left, 300px right)

**Desktop (≥ 1024px):**
- Current behavior: sidebars with margins
- Both drawers can be open simultaneously

#### 2. Canvas Area Behavior
**Mobile:**
- Full viewport when drawers closed
- Slightly reduced when drawer open (for visual feedback)
- Minimum canvas size: 200px (down from 240px)
- Maximum canvas size: 90% of viewport (down from 80% to account for smaller screens)
- Canvas centers in available space

**Tablet:**
- Similar to mobile but with more space
- Can accommodate sidebars if both open

**Desktop:**
- Current behavior maintained

#### 3. Toggle Buttons
**Mobile:**
- **Bottom navigation bar** instead of side buttons
- Icons for: Import, Controls, Export
- Always visible, doesn't overlap canvas
- Or: **Floating action buttons** in corners (top-left for import, top-right for controls)

**Tablet:**
- Can use side buttons or bottom navigation
- Adaptive based on orientation

**Desktop:**
- Current side buttons maintained

#### 4. Touch-Friendly Considerations
- **Larger touch targets**: Minimum 44x44px for all interactive elements
- **Gesture support**: 
  - Swipe left/right to switch between drawers
  - Pinch to zoom on canvas
  - Two-finger pan (already supported via pointer events)
- **Prevent accidental touches**: 
  - Debounce rapid taps
  - Require intentional gestures for critical actions
- **Safe area support**: Account for notches and home indicators

## Implementation Plan

### Phase 1: Responsive Drawer System

#### A. Create Responsive Hook
```typescript
// hooks/useResponsive.ts
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  
  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])
  
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet }
}
```

#### B. Update Drawer Components
**LeftDrawer.tsx:**
- Add mobile detection
- Full-screen overlay on mobile (`w-full` instead of `w-[300px]`)
- Backdrop overlay when open on mobile
- Auto-close other drawer when opening on mobile

**RightDrawer.tsx:**
- Same mobile behavior
- Already has `w-full md:w-[350px]` - needs mobile-specific logic

#### C. Update App.tsx Layout
**Current:**
```tsx
<div style={{
  marginLeft: leftDrawerOpen ? '300px' : '0',
  marginRight: rightDrawerOpen ? '350px' : '0',
}}>
```

**Proposed:**
```tsx
// Mobile: no margins, drawers are overlays
// Desktop: current behavior
<div className={cn(
  "transition-all duration-300",
  isMobile ? "" : 
    leftDrawerOpen ? "ml-[300px]" : "ml-0",
  isMobile ? "" :
    rightDrawerOpen ? "mr-[350px]" : "mr-0"
)}>
```

### Phase 2: Mobile Navigation

#### Option A: Bottom Navigation Bar (Recommended)
```
┌─────────────────────────┐
│      Canvas Area         │
│                          │
│                          │
├─────────────────────────┤
│ [Import] [Controls] [Export] │
└─────────────────────────┘
```

**Benefits:**
- Always accessible
- Doesn't overlap canvas
- Standard mobile pattern
- Thumb-friendly

#### Option B: Floating Action Buttons
```
┌─────────────────────────┐
│ [Import]        [Controls]│
│                          │
│      Canvas Area         │
│                          │
│                    [Export]│
└─────────────────────────┘
```

**Benefits:**
- More screen space for canvas
- Modern design pattern
- Can be hidden during editing

### Phase 3: Canvas Sizing Adjustments

**Update Canvas.tsx:**
```typescript
const canvasSize = useMemo(() => {
  const isMobile = windowSize.width < 768
  const availableWidth = isMobile 
    ? windowSize.width * 0.95  // More space on mobile
    : windowSize.width * 0.8
  
  const minWidth = isMobile ? 200 : CANVAS.MIN_WIDTH
  const maxWidth = isMobile 
    ? windowSize.width * 0.9  // Smaller max on mobile
    : CANVAS.MAX_WIDTH
  
  // ... rest of calculation
}, [windowSize, aspectRatio, isMobile])
```

### Phase 4: Touch Gestures

**Enhancements:**
1. **Swipe to close drawers**: Detect swipe gesture on drawer content
2. **Pinch to zoom**: Already supported, but optimize for mobile
3. **Two-finger pan**: Already supported
4. **Long press menus**: Context menus for advanced actions

## Detailed Component Changes

### 1. App.tsx
```tsx
// Add responsive detection
const { isMobile } = useResponsive()

// Conditional margins
<div className={cn(
  "transition-all duration-300",
  !isMobile && leftDrawerOpen && "ml-[300px]",
  !isMobile && rightDrawerOpen && "mr-[350px]"
)}>
```

### 2. LeftDrawer.tsx
```tsx
// Mobile: full-screen overlay with backdrop
<div className={cn(
  "fixed left-0 top-0 z-20 h-screen bg-canvas-control/90 backdrop-blur",
  "transition-transform duration-300 ease-in-out",
  isMobile ? "w-full" : "w-[300px]",
  leftDrawerOpen ? "translate-x-0" : "-translate-x-full"
)}>
  {/* Backdrop for mobile */}
  {isMobile && leftDrawerOpen && (
    <div 
      className="absolute inset-0 bg-black/50 -z-10"
      onClick={toggleLeftDrawer}
    />
  )}
</div>
```

### 3. RightDrawer.tsx
```tsx
// Similar changes - already has w-full md:w-[350px]
// Add backdrop for mobile
{isMobile && rightDrawerOpen && (
  <div 
    className="absolute inset-0 bg-black/50 -z-10"
    onClick={toggleRightDrawer}
  />
)}
```

### 4. Mobile Navigation Component (New)
```tsx
// components/navigation/MobileNav.tsx
export const MobileNav = () => {
  const { isMobile } = useResponsive()
  if (!isMobile) return null
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 
                    bg-canvas-control/95 backdrop-blur border-t border-white/10
                    safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        <button onClick={toggleLeftDrawer}>Import</button>
        <button onClick={toggleRightDrawer}>Controls</button>
        <button onClick={handleExport}>Export</button>
      </div>
    </nav>
  )
}
```

### 5. Drawer Auto-Close Logic
```tsx
// In store or hook
const handleDrawerToggle = (drawer: 'left' | 'right') => {
  if (isMobile) {
    // Close other drawer when opening one
    if (drawer === 'left' && !leftDrawerOpen) {
      setRightDrawerOpen(false)
    }
    if (drawer === 'right' && !rightDrawerOpen) {
      setLeftDrawerOpen(false)
    }
  }
  // Toggle the requested drawer
  toggleDrawer(drawer)
}
```

## Canvas Sizing Strategy

### Mobile Viewport Considerations
- **Safe area**: Account for notches (iPhone X+)
- **Keyboard**: When keyboard appears, reduce canvas height
- **Orientation**: Handle portrait/landscape changes
- **Viewport units**: Use `dvh` (dynamic viewport height) for better mobile support

### Responsive Canvas Constants
```typescript
export const CANVAS = {
  DEFAULT_BASE_WIDTH: 1600,
  MIN_WIDTH: 240,
  MAX_WIDTH: 1400,
  // Mobile-specific
  MOBILE_MIN_WIDTH: 200,
  MOBILE_MAX_WIDTH_RATIO: 0.9, // 90% of viewport
  MOBILE_AVAILABLE_RATIO: 0.95, // 95% available space
} as const
```

## Touch Gesture Enhancements

### 1. Swipe to Close Drawers
```tsx
// Use @use-gesture/react (already in dependencies)
import { useDrag } from '@use-gesture/react'

const bind = useDrag(({ direction, distance, cancel }) => {
  if (direction[0] < -0.5 && distance > 50) {
    // Swipe left to close right drawer
    toggleRightDrawer()
    cancel()
  }
  if (direction[0] > 0.5 && distance > 50) {
    // Swipe right to close left drawer
    toggleLeftDrawer()
    cancel()
  }
})

<div {...bind()}>Drawer content</div>
```

### 2. Prevent Body Scroll When Drawer Open
```tsx
useEffect(() => {
  if (isMobile && (leftDrawerOpen || rightDrawerOpen)) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => {
    document.body.style.overflow = ''
  }
}, [isMobile, leftDrawerOpen, rightDrawerOpen])
```

## Performance Considerations

### 1. Lazy Load Drawer Content
- Only render drawer content when open on mobile
- Reduces initial render time

### 2. Virtual Scrolling
- For image queue on mobile (if many images)
- Use `react-window` or similar

### 3. Debounce Resize Events
- Prevent excessive recalculations during orientation changes

## Accessibility

### Mobile-Specific
- **Screen reader support**: Announce drawer state changes
- **Keyboard navigation**: Support for external keyboards on tablets
- **Focus management**: Trap focus within open drawer
- **High contrast mode**: Ensure visibility in bright sunlight

## Testing Strategy

### Breakpoints to Test
- **320px**: Smallest mobile (iPhone SE)
- **375px**: Standard mobile (iPhone 12/13)
- **414px**: Large mobile (iPhone Pro Max)
- **768px**: Tablet portrait
- **1024px**: Tablet landscape / Small desktop
- **1280px+**: Desktop

### Test Cases
1. Drawer opens/closes correctly on all breakpoints
2. Canvas resizes appropriately
3. Only one drawer open on mobile
4. Touch gestures work smoothly
5. Orientation changes handled
6. Keyboard doesn't break layout
7. Safe areas respected (notches, home indicators)

## Migration Path

### Step 1: Add Responsive Detection (Non-breaking)
- Add `useResponsive` hook
- No behavior changes yet

### Step 2: Update Drawer Behavior (Backward compatible)
- Add mobile classes conditionally
- Desktop behavior unchanged

### Step 3: Update App Layout (Backward compatible)
- Conditional margins based on screen size
- Desktop unchanged

### Step 4: Add Mobile Navigation (New feature)
- Only shows on mobile
- Doesn't affect desktop

### Step 5: Enhance Touch Gestures (Enhancement)
- Optional improvements
- Doesn't break existing functionality

## Recommended Implementation Order

1. **Phase 1**: Responsive drawer system (highest priority)
2. **Phase 2**: Mobile navigation (high priority)
3. **Phase 3**: Canvas sizing adjustments (medium priority)
4. **Phase 4**: Touch gesture enhancements (nice to have)

## Summary

**Key Changes:**
- Drawers become full-screen overlays on mobile
- Only one drawer open at a time on mobile
- Bottom navigation bar for mobile
- Responsive canvas sizing
- Touch-friendly interactions

**Benefits:**
- ✅ Works on all screen sizes
- ✅ Doesn't break desktop experience
- ✅ Follows mobile design patterns
- ✅ Maintains all functionality
- ✅ Progressive enhancement approach

**No Breaking Changes:**
- All changes are additive or conditional
- Desktop behavior preserved
- Backward compatible
