## 2025-02-23 - Unnecessary derived state array re-mapping on every render
**Learning:** React component derived state using mapping such as `Array.map` on props outside the render loop forces a re-mapping on every interaction with state even if dependencies haven't changed.
**Action:** Wrap derived array mapping inside `useMemo` specifically when filtering static references matched against dynamic ones passed in as props to save redundant iterations.
