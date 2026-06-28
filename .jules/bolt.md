## 2024-06-28 - Avoid Overlapping Routes
**Learning:** Next.js builds in this repository fail due to ambiguous app routes in the blog directory (overlapping dynamic segments `/blog/[category]` vs `/blog/[slug]`).
**Action:** Avoid touching these overlapping routes unless explicitly required, and ignore build failures arising from this known ambiguous routing bug that is outside the scope of the performance task.
