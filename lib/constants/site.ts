const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://aipowerstacks.com'

export const SITE_URL = rawSiteUrl.replace(/\/$/, '')
