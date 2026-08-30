# Task 2: Workbench Shell — Operating Environment

## Agent: Full Stack Developer
## Date: 2026-03-04

## Summary

Created the VVU Operating Environment shell — a complete replacement for the old VvuShell dashboard. The new shell transforms VVU from a simple product dashboard into a capability-driven operating environment with edge docks, proximity detection, focus mode, and progressive trust onboarding.

## Files Created

### 1. `src/components/vvu/edge-dock.tsx`
Reusable dock component with:
- **Position support**: left, right, top, bottom
- **Proximity detection**: 25px zone near each edge, throttled to ~60fps using `requestAnimationFrame`
- **Auto-hide/show**: Docks slide in when cursor approaches, slide out when cursor leaves
- **Pin/unpin**: Docks can be pinned (always visible) or auto-hide
- **Resize handle**: Drag to resize dock width/height
- **Glow effect**: Emerald green glow when cursor is near the edge
- **Focus mode integration**: Docks can be configured to hide during focus mode
- **Custom style prop**: Allows background color customization

### 2. `src/components/vvu/capability-home.tsx`
The "What do you want to do?" home screen:
- **Search/filter**: Full-text search across capabilities
- **Category grouping**: Verification, Infrastructure, Community, Research & Simulation
- **Capability cards**: Each shows icon, title, description, trust tier badge, products used, trust journey progress
- **DynamicIcon component**: Stable component that renders Lucide icons by name (avoids React lint issues)
- **Trust tier badges**: Color-coded badges for browse/verified/financial/web3
- **Edition badges**: Community/Professional/Enterprise indicators
- **Trust journey progress**: Visual progress bars for each capability's onboarding steps
- **Smooth entry animations**: Staggered card animations with framer-motion

### 3. `src/components/vvu/trust-journey-modal.tsx`
Progressive trust onboarding modal:
- **5 step types**: Discover → Learn → Interactive → Reveal → License
- **Progress bar**: Visual progress indicator with step markers
- **Knowledge checks**: Multiple-choice questions on "Learn" steps
- **Skip optional toggle**: Users can skip optional steps
- **Consent receipt generation**: JSON receipt with capability ID, completed steps, timestamp, version
- **Step navigation**: Back/forward buttons, clickable step indicators
- **Completion state**: Shows a green checkmark and consent receipt when all steps are done
- **Calm, non-aggressive UI**: Emerald/amber color scheme, not pushy

### 4. `src/components/vvu/workbench-shell.tsx`
The main operating environment shell:
- **4 Edge Docks**:
  - **Left dock**: Product navigation (Home button + product list)
  - **Right dock**: Context panel (capability telemetry, trust metrics)
  - **Top dock**: Global actions bar (search, focus mode toggle, auth bar)
  - **Bottom dock**: Status bar (circuit breaker, trust metrics, shortcuts)
- **Focus mode**: Press `F` to enter, `Esc` to exit; hides side docks, shows indicator
- **Capability-driven entry**: When no product is active, shows the CapabilityHome screen
- **Smooth transitions**: 150ms GPU-accelerated animations (transform + opacity only)
- **Keyboard shortcuts**: `⌘K` for command palette, `F` for focus mode, `Esc` for home, `?` for shortcuts
- **Workspace store integration**: Uses Zustand store for all state management
- **Layout persistence**: Loads saved layout on mount via the workspace store
- **Starts on capability home**: Defaults to `activeProduct: null` to show the "What do you want to do?" screen

### 5. `src/app/page.tsx` (modified)
Updated to use `WorkbenchShell` instead of `VvuShell`:
- Changed dynamic import from `VvuShell` to `WorkbenchShell`
- Updated loading state text to "initializing operating environment"
- Updated background color to `#0a0a0f`

## Key Architectural Decisions

1. **Capability-driven UX**: Users interact with outcomes ("Verify Authenticity") not product names ("ProofBridge"). This is the core design philosophy.

2. **Edge dock system**: The 4-dock layout provides persistent access to navigation, context, actions, and status without cluttering the main workspace.

3. **Proximity detection**: Uses `requestAnimationFrame` for smooth 60fps detection, with a 25px proximity zone. The `enabled` state is tracked via a ref to avoid re-registering event listeners.

4. **Focus mode**: When activated, side docks auto-hide and the active product owns the full screen. A subtle indicator shows which product is active.

5. **Color scheme**: Emerald green (primary) + amber/gold (accent) on dark background (#0a0a0f). No indigo/blue.

6. **DynamicIcon pattern**: Created a stable `DynamicIcon` component that renders Lucide icons by name. This avoids the `react-hooks/static-components` lint issue.

7. **No existing files modified**: Only created new files and updated `page.tsx` to reference the new shell.

## Lint Status
- 0 errors, 1 warning (disposable-storage file, not our code)
