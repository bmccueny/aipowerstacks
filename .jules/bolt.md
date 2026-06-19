## 2024-06-19 - Avoid `new Date()` inside `Array.prototype.sort()`
**Learning:** Parsing dates with `new Date(string).getTime()` inside a sort comparator creates massive overhead because the comparator is called O(N log N) times, resulting in many redundant object allocations and parses. For ISO 8601 strings (standard DB timestamps), string comparison is sufficient and vastly faster.
**Action:** Use string comparison operators (`<`, `>`) or pre-calculate timestamps when sorting by date strings to avoid redundant Date object creation.
