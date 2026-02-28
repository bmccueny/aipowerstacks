This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Daily AI News Automation (Vercel Cron + RSS)

This project supports automated AI news ingestion via:

- `GET /api/cron/ai-news` (secured with `CRON_SECRET`)
- homepage section: `Latest AI News`

### Setup

1. Add these env vars in Vercel:
   - `CRON_SECRET` (required)
   - `NEWS_RSS_URL` (optional, defaults to `https://www.artificialintelligence-news.com/feed/`)
   - `NEWS_SOURCE_NAME` (optional)
   - `N8N_WEBHOOK_SECRET` (required for `/api/news/ingest`)
   - `XAI_API_KEY` (required only if workflow generates Grok images)
   - `GROK_IMAGE_MODEL` (optional, default `grok-2-image`)
   - `BLOG_AUTOMATION_AUTHOR_ID` (optional; if unset, first admin profile is used)
2. Keep `vercel.json` committed so the cron schedule is active.
3. Deploy to Vercel.

Cron is configured to run once daily at `17:00 UTC` (`0 17 * * *`).

## Compare Metadata Backfill

Use this script to fill or refresh compare metadata on `public.tools`:

- `use_case`
- `team_size`
- `integrations`

Commands:

```bash
npm run backfill:compare:dry
npm run backfill:compare:apply
```

Optional flags:

- `--status=published|pending|all` (default: `published`)
- `--limit=100`
- `--sample=10`
- `--concurrency=8`
- `--force` (overwrite existing values, not only missing fields)

Example:

```bash
node scripts/backfill-tool-compare-metadata.mjs --apply --status=published --limit=200
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
