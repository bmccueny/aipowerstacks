
## 2026-06-22 - Next.js App Router Server Data Re-rendering
**Learning:** Next.js App Router creates new object references on every navigation for server-fetched data. This defeats standard `React.memo` shallow comparison for components that receive these objects as props (like a `ToolCard` receiving a `tool` object), leading to unnecessary re-renders in lists or grids during navigation changes.
**Action:** Always provide a custom comparison function to `React.memo()` when memoizing components that receive server-fetched objects. Ensure the comparison checks specific identity properties (like `id`) and relevant UI primitives, rather than comparing the entire object reference.
