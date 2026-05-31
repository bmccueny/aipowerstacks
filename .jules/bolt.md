## 2024-05-31 - CostCalculator array filtering
**Learning:** React component array filtering callbacks (`.filter()`) in performance-critical areas (like large tool search results) recalculate string casing methods on every iteration if not cached externally.
**Action:** Always extract invariant string calculations like `.toLowerCase()` outside of `.map()` or `.filter()` loops to avoid redundant operations.
