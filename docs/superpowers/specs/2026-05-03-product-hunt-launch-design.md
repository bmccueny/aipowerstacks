# Product Hunt Launch — AIPowerStacks

## Date: Week of May 5, 2026 (Tuesday or Wednesday for best traction)

## Positioning

**Tagline:** How much is AI costing you?

**Subtitle:** Track your AI subscriptions, detect overlap, and find out which tools to cancel. 700+ tools with real pricing data. Free forever.

**Category:** Productivity, Developer Tools, AI

---

## Launch Assets

### 1. Product Hunt Description

**First paragraph (hook):**
> The average team spends $120/mo on AI tools. Most are paying for 2-3 tools that do the same thing. AIPowerStacks shows you exactly where the overlap is — and which ones to cancel.

**What it does:**
> - Tap your tools, see your total spend in seconds
> - AI-powered overlap detection flags tools competing for the same job
> - Stack Advisor recommends your optimal setup based on role and budget
> - 700+ tools with real pricing tiers, ratings, and comparisons
> - Weekly price change alerts so you never overpay

**Free forever:**
> No premium tier. No credit card. No catch. We monetize through featured tool placements, not your wallet.

### 2. Maker's First Comment

> Hey PH! I'm Brendan 👋
>
> I built this because I was paying for ChatGPT, Claude, Perplexity, AND Gemini — and realized they overlap by about 80%. That's $70/mo for tools doing the same thing.
>
> So I built a tracker. Then added overlap detection. Then realized 700+ AI tools have pricing data scattered across the internet with no single source of truth.
>
> AIPowerStacks is:
> - A subscription tracker (add tools, see your monthly burn)
> - An overlap detector (AI finds which tools compete for the same job)
> - A Stack Advisor (tell it your role + budget, get your optimal stack)
> - A pricing database (700+ tools with real tier data, updated daily)
>
> The whole thing is free. No premium plan, no gated features.
>
> Would love your feedback — what tools are you overpaying for?

### 3. Gallery Images (5 slides)

1. **Hero shot** — Homepage with "How much is AI costing you?" headline + stats grid
2. **Calculator demo** — Tool tap grid showing $87/mo total with receipt
3. **Stack Advisor** — Role selection + AI recommendation results
4. **Compare view** — Side-by-side tool comparison matrix
5. **Overlap detection** — AI flagging duplicate tools with savings amount

### 4. Topics/Tags
- Artificial Intelligence
- Productivity
- SaaS
- Developer Tools
- Free

---

## Technical Prep

### PH Welcome Page (`/welcome`)
- Dedicated landing for `?ref=producthunt` traffic
- Stronger CTA (skip the hero, go straight to calculator)
- Social proof banner: "Featured on Product Hunt"
- Simplified page — no blog section, just value prop → calculator → sign up

### UTM Tracking
- All PH links use `?ref=producthunt`
- Track in Vercel Analytics as separate campaign
- Newsletter signup tags PH visitors for segment

### Post-Launch Badge
- Add "Featured on Product Hunt" badge to navbar/footer after launch day
- Link back to PH page for ongoing social proof

---

## Launch Day Strategy

### Timing
- **Tuesday or Wednesday** at 12:01 AM PST (PH reset time)
- Have maker comment ready to post immediately after going live

### Upvote Mobilization
- Email newsletter subscribers day-of: "We launched on Product Hunt — would love your support"
- Post on X/Twitter with link
- LinkedIn post (longer-form story)
- Any communities you're in (Slack, Discord, Reddit — follow their self-promo rules)

### Day-Of Engagement
- Respond to EVERY comment within 30 minutes
- Upvote and thank supporters
- Post 2-3 milestone updates ("Top 5! Thanks everyone!")

---

## Success Metrics
- **Goal:** Top 10 of the day (realistic for a free tool with this quality)
- **Stretch:** #1 Product of the Day
- **Signups target:** 500+ new users from PH traffic
- **Affiliate impact:** Track whether PH visitors click through to tools

---

## Files to Create/Modify
- `/app/(public)/welcome/page.tsx` — PH landing variant
- `/components/common/ProductHuntBadge.tsx` — badge component
- Homepage: add `?ref=producthunt` detection for welcome message
- Newsletter cron: special PH day email to subscribers
