## 2024-05-18 - Ambiguous Next.js Routes
**Learning:** Next.js throws 'Ambiguous app routes detected' error when dynamic segments have overlapping patterns (e.g. `/blog/[category]` and `/blog/[slug]`). Next.js 16+ has become stricter about this.
**Action:** Need to check app/blog routes and ensure there are no overlapping dynamic routes, or re-structure if necessary. For now we will focus on the main objective which is a performance improvement.
## 2024-05-18 - ToolCard Memoization
**Learning:** In Next.js App Router applications, server-fetched data passed to client components creates new object references on every render. The ToolGrid maps over these objects and passes them to ToolCard, causing unnecessary re-renders when the parent component re-renders (e.g. from hover states, transitions, etc).
**Action:** Wrap ToolCard in React.memo with a custom comparison function that checks the 'id' and 'slug' (or relevant primitives) to prevent unnecessary re-renders of the grid items.
