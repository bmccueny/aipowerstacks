# AI Power Stacks — Code Guidelines

## Stack
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase, Stripe, shadcn/ui

## TypeScript Rules
- **Never use `any`**. Use types from `lib/types/index.ts` and `lib/types/database.ts`. If Supabase generated types are missing a column or RPC function, add it to `database.ts` rather than casting to `any`.
- For catch blocks, use `catch (err: unknown)` and narrow with `err instanceof Error ? err.message : String(err)`.
- For Supabase queries with ambiguous relationship hints, cast the result (`data as SomeType[]`), not the client (`supabase as any`).
- `filter(Boolean)` doesn't narrow types in TS. Use `filter((x): x is T => x != null)` instead.

## CSS Rules
- **Don't add CSS custom properties** unless they'll be used in 3+ places. Use existing design tokens in `globals.css :root`.
- Glass effects use the `--lg-*` variable system. Don't create new blur/saturate combos — use `.glass-card`, `.card-directory`, or `.card-content`.
- The navbar glass effect is `backdrop-blur-xl saturate-150` (24px blur, 150% saturate). Cards should match this.
- `-webkit-backdrop-filter` is required alongside `backdrop-filter` for Safari.
- The `@theme inline` block in `globals.css` is required by Tailwind 4 — don't remove it.

## Code Quality
- Don't leave `console.log` or `console.error` in production code. Exceptions: error boundaries and catch blocks where it's the only error handling.
- Don't add comments that restate what the code does. Only comment to explain WHY.
- Don't add tokens, variables, or classes "just in case" — only add what's used.
- Don't duplicate logic. If the same pattern appears 3+ times, extract a helper.
- Prefer `for` loops over `.forEach()` when the callback mutates outer variables (TS can't narrow inside closures).

## Project Structure
- Types: `lib/types/index.ts` (app types), `lib/types/database.ts` (Supabase generated + manual additions)
- Supabase queries: `lib/supabase/queries/` (tools, blog, etc.)
- Glass styling: `app/globals.css` (CSS classes), `lib/liquid-glass.ts` + `hooks/useLiquidGlass.ts` (JS physics engine)
- AI matchmaker: `lib/matchmaker/` (intent, scoring, narrative)
