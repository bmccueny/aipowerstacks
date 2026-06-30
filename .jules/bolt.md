## 2024-05-15 - React.memo Array Comparison
**Learning:** When writing custom `arePropsEqual` functions for `React.memo`, especially when checking properties dynamically via `Object.keys()`, checking array length is not enough. You must do an element-by-element comparison to ensure you aren't ignoring updates to array contents (like tags changing from "Free" to "Paid").
**Action:** Always verify array element equality explicitly in custom `arePropsEqual` functions to prevent stale UI bugs.
