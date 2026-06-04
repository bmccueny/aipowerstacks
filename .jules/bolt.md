## 2024-06-04 - Unused hover states trigger unnecessary renders
**Learning:** Found unused `hasBeenHovered` state within `components/tools/ToolCard.tsx` that was being set via `onMouseEnter`. This meant that moving the cursor across the site would unnecessarily trigger re-renders on every single tool card without actually using that state in the UI.
**Action:** Audit codebase for states set inside events (`onMouseEnter`, `onMouseMove`, `onScroll`) that are completely dead to eliminate low hanging re-renders.
