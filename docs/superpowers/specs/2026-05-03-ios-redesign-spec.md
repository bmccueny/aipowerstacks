# iOS-Inspired Frontend Redesign — Continuation Spec

## What's Done (Session 1)

### Design Tokens (globals.css)
- Light: pure white bg `#FFFFFF`, iOS grays `#F2F2F7`, `#E5E5EA`, `#8E8E93`
- Dark: true black `#000000`, iOS cards `#1C1C1E`, dark gray `#2C2C2E`, red primary `#FF453A`
- Removed: cosmic backgrounds, glass morphism, colored glows, complex box-shadows
- Simplified: `.glass-card` → solid bg + 1px border, `.page-shell` → no backdrop-blur, `.btn-glow` → subtle shadow + translateY

### Layout (layout.tsx)
- Removed stars, nebula, TwinklingStars divs
- Skip-to-content link added

### Navbar
- Changed to `bg-background/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-border/50`

---

## What Needs Fixing (Session 2)

### Priority 1: Homepage (app/page.tsx)

1. **CTA dark block** — Uses `bg-foreground` which is now `#1C1C1E` in light mode. Should use a cleaner pattern:
   - Light: `bg-[#1C1C1E]` (iOS dark surface)
   - Dark: `bg-card` with border
   - The demo GIF section inside needs contrast adjustment

2. **Stats grid cards** — Currently `border-foreground/[0.05]` which is nearly invisible on white. Change to `border-border` for consistent iOS border.

3. **Calculator section** — Tool grid buttons have `border-foreground/[0.06]` borders. Needs `border-border` and slightly rounded corners (rounded-xl).

4. **"How it works" step circles** — `bg-foreground text-background` works but looks harsh. Consider `bg-[#1C1C1E]` explicit for both modes.

5. **Newsletter section** — The `gap-px bg-foreground/[0.06]` separator hack should be `divide-x divide-border` instead.

### Priority 2: Component Cleanup

6. **ToolCard (components/tools/ToolCard.tsx)** — Current card uses complex border opacity patterns. Simplify to:
   - `bg-card border border-border rounded-xl`
   - Hover: `hover:shadow-sm hover:border-border-foreground/20`
   - No backdrop-blur, no glass

7. **Footer (components/layout/Footer.tsx)** — Should look like iOS Settings grouped sections:
   - Section headers: 13px uppercase gray
   - Link rows: 15px system font, no underline, hover highlight
   - Clean dividers between sections

8. **OverlapTeaser cards** — Currently `border-foreground/[0.06]`. Change to `border-border`.

### Priority 3: Mobile Experience

9. **Bottom tab bar** — Replace hamburger menu with iOS-style tab bar on mobile:
   - Fixed bottom, 5 tabs: Home, Browse, Tracker, Compare, More
   - 49px height + safe-area-inset-bottom
   - Active tab: primary color icon + label
   - Inactive: `#8E8E93` gray
   - `bg-background/80 backdrop-blur-2xl` (like navbar)

10. **Mobile menu** — Current `liquid-glass-sheet` overlay → replace with clean white slide-down or bottom sheet

### Priority 4: Typography

11. **System font feel** — Geist Sans is close to SF Pro. Tighten the scale:
   - h1: 34px / -0.02em (iOS large title)
   - h2: 22px / -0.01em (iOS title 1)
   - h3: 17px / 0 (iOS headline)
   - Body: 15px / 0 (iOS body)
   - Caption: 13px (iOS caption)
   - All headings: font-weight 700 (bold, not 800 extrabold)

12. **Section labels** — Currently `text-sm uppercase tracking-[0.12em]`. iOS uses 13px gray non-uppercase for grouped headers. Consider switching to iOS style.

### Priority 5: Dark Mode Polish

13. **Card surfaces** — In dark mode, cards should be `#1C1C1E` on `#000000` background (iOS standard)
14. **Borders** — Dark borders should be `#38383A` (iOS separator dark)
15. **Grouped tables** — Tool lists, user lists → iOS grouped table style (inset rounded corners, separator lines)

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/page.tsx` | CTA block colors, stat card borders, newsletter separator |
| `app/globals.css` | Already updated — may need minor tweaks |
| `components/tools/ToolCard.tsx` | Simplified card styling |
| `components/layout/Footer.tsx` | iOS Settings-style grouped sections |
| `components/layout/Navbar.tsx` | Mobile bottom tab bar (new component) |
| `components/home/CostCalculator.tsx` | Tool grid button borders |
| `components/home/OverlapTeaser.tsx` | Card borders |

---

## Design References

- **iOS Human Interface Guidelines**: System colors, typography scale, grouped content
- **Apple.com**: Card layouts, spacing, button styles
- **Reddit mobile app**: Bottom tab bar, content cards, clean feeds
- **Facebook**: News feed card style, comment sections, clean borders

## Testing

1. `npx next build` after each change
2. Screenshot desktop: `npx -y playwright@latest screenshot --full-page https://www.aipowerstacks.com /tmp/check.png`
3. Screenshot mobile: `npx -y playwright@latest screenshot --full-page --viewport-size="375,812" https://www.aipowerstacks.com /tmp/check-mobile.png`
4. Check dark mode manually in browser
5. Deploy: `npx vercel --prod --yes`
