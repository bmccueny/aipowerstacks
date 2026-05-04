#!/usr/bin/env npx tsx
/**
 * Generate rich AI comparison verdicts for the top tool pairs
 * and store them in the tool_comparisons table (or as JSON fallback).
 *
 * Usage:
 *   npx tsx scripts/generate-comparison-verdicts.ts              # dry run (preview pairs)
 *   npx tsx scripts/generate-comparison-verdicts.ts --apply       # generate + store in DB
 *   npx tsx scripts/generate-comparison-verdicts.ts --apply --json-fallback  # generate + store as JSON files
 *   npx tsx scripts/generate-comparison-verdicts.ts --apply --limit=10       # only first 10 pairs
 *   npx tsx scripts/generate-comparison-verdicts.ts --apply --concurrency=3  # parallel requests
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Load .env.local ────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

try {
  const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    val = val.replace(/\\n/g, "").trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn("[verdict-gen] .env.local not found, using existing env");
}

// ─── Config ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  .replace(/\\n/g, "")
  .trim();
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "")
  .replace(/\\n/g, "")
  .trim();
const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || "")
  .replace(/\\n/g, "")
  .trim();
const XAI_API_KEY = (process.env.XAI_API_KEY || "")
  .replace(/\\n/g, "")
  .trim();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "[verdict-gen] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// Determine which AI provider to use
const AI_PROVIDER: "anthropic" | "xai" = ANTHROPIC_API_KEY
  ? "anthropic"
  : XAI_API_KEY
    ? "xai"
    : (() => {
        console.error(
          "[verdict-gen] Missing ANTHROPIC_API_KEY or XAI_API_KEY. Set at least one."
        );
        process.exit(1);
      })();

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── CLI args ───────────────────────────────────────────────────────────────
const APPLY = process.argv.includes("--apply");
const JSON_FALLBACK = process.argv.includes("--json-fallback");

function getArgValue(name: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  const n = parseInt(arg.split("=")[1], 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const PAIR_LIMIT = getArgValue("limit", 0); // 0 = all
const CONCURRENCY = getArgValue("concurrency", 2);
const TOP_N_TOOLS = getArgValue("top", 20);
const VERDICTS_DIR = join(__dirname, "verdicts");

// ─── Types ──────────────────────────────────────────────────────────────────
interface ToolRow {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  use_case: string | null;
  avg_rating: number;
  review_count: number;
  pricing_model: string | null;
  pricing_details: string | null;
  target_audience: string | null;
  categories: { name: string; slug: string } | null;
}

interface ComparisonPair {
  toolA: ToolRow;
  toolB: ToolRow;
}

interface VerdictResult {
  tool_a_id: string;
  tool_b_id: string;
  tool_a_slug: string;
  tool_b_slug: string;
  verdict_html: string;
  winner_slug: string | null;
}

// ─── Table creation ─────────────────────────────────────────────────────────
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS tool_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_a_id uuid REFERENCES tools(id),
  tool_b_id uuid REFERENCES tools(id),
  verdict_html text NOT NULL,
  winner_slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tool_a_id, tool_b_id)
);

CREATE INDEX IF NOT EXISTS idx_tool_comparisons_a ON tool_comparisons(tool_a_id);
CREATE INDEX IF NOT EXISTS idx_tool_comparisons_b ON tool_comparisons(tool_b_id);
CREATE INDEX IF NOT EXISTS idx_tool_comparisons_pair ON tool_comparisons(tool_a_id, tool_b_id);
`;

async function ensureTable(): Promise<boolean> {
  // Try inserting into the table to see if it exists
  const { error: probeError } = await supabase
    .from("tool_comparisons")
    .select("id")
    .limit(1);

  if (!probeError) {
    console.log("[verdict-gen] tool_comparisons table exists");
    return true;
  }

  // Table doesn't exist, try to create it via RPC
  console.log("[verdict-gen] tool_comparisons table not found, attempting DDL...");

  try {
    const { error: rpcError } = await supabase.rpc("exec_sql", {
      sql: CREATE_TABLE_SQL,
    });

    if (rpcError) {
      throw rpcError;
    }

    console.log("[verdict-gen] tool_comparisons table created via exec_sql RPC");
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[verdict-gen] DDL failed: ${msg}`);
    console.warn("[verdict-gen] Run this SQL manually in Supabase Dashboard:");
    console.warn(CREATE_TABLE_SQL);
    console.warn(
      "[verdict-gen] Falling back to JSON file output in scripts/verdicts/"
    );
    return false;
  }
}

// ─── Fetch top tools ────────────────────────────────────────────────────────
async function fetchTopTools(limit: number): Promise<ToolRow[]> {
  console.log(`[verdict-gen] Fetching top ${limit} tools by review_count...`);

  const { data, error } = await supabase
    .from("tools")
    .select(
      "id, name, slug, tagline, description, use_case, avg_rating, review_count, pricing_model, pricing_details, target_audience, categories(name, slug)"
    )
    .eq("status", "published")
    .order("review_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[verdict-gen] Failed to fetch tools:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error("[verdict-gen] No published tools found");
    process.exit(1);
  }

  console.log(`[verdict-gen] Fetched ${data.length} tools`);
  return data as ToolRow[];
}

// ─── Check existing comparisons ─────────────────────────────────────────────
async function fetchExistingPairs(
  useDb: boolean
): Promise<Set<string>> {
  const existing = new Set<string>();

  if (!useDb) {
    // Check JSON files
    if (existsSync(VERDICTS_DIR)) {
      try {
        const indexPath = join(VERDICTS_DIR, "_index.json");
        if (existsSync(indexPath)) {
          const index = JSON.parse(readFileSync(indexPath, "utf8")) as Array<{
            tool_a_id: string;
            tool_b_id: string;
          }>;
          for (const entry of index) {
            existing.add(`${entry.tool_a_id}::${entry.tool_b_id}`);
          }
        }
      } catch {
        // ignore
      }
    }
    return existing;
  }

  // Check DB
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("tool_comparisons")
      .select("tool_a_id, tool_b_id")
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.warn("[verdict-gen] Could not check existing pairs:", error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      existing.add(`${row.tool_a_id}::${row.tool_b_id}`);
    }
    offset += pageSize;
  }

  return existing;
}

// ─── Generate pairs ─────────────────────────────────────────────────────────
function generatePairs(
  tools: ToolRow[],
  existing: Set<string>
): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];

  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const a = tools[i];
      const b = tools[j];

      // Canonical ordering: alphabetical by slug
      const [toolA, toolB] = a.slug < b.slug ? [a, b] : [b, a];
      const key = `${toolA.id}::${toolB.id}`;

      if (existing.has(key)) continue;

      pairs.push({ toolA, toolB });
    }
  }

  return pairs;
}

// ─── Claude Haiku API call ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior AI tools analyst writing comparison verdicts for AI Power Stacks, a trusted AI tools directory. Your verdicts are read by professionals choosing between tools.

Rules:
1. Write 150 to 250 words in HTML using 2 to 3 paragraph tags only.
2. Open with a direct, opinionated statement about which tool is stronger for which use case.
3. Compare key differences: pricing, features, target audience, strengths, and weaknesses.
4. End with a clear recommendation that helps the reader decide.
5. Be factual. Only reference data provided in the prompt. Do not invent features or statistics.
6. Do NOT use dashes (hyphens used as em dashes) or semicolons anywhere in the text.
7. Do NOT use bullet points, lists, or headers. Only flowing paragraph text in <p> tags.
8. Write in a confident, editorial tone. Avoid hedging language like "it depends" or "both are great."
9. If one tool clearly outperforms the other based on the data, say so plainly.
10. If the tools serve different audiences, clarify who should pick which and why.

Return ONLY the HTML (opening <p> to closing </p>). No markdown fences, no explanation, no preamble.`;

function buildComparisonPrompt(a: ToolRow, b: ToolRow): string {
  const formatTool = (t: ToolRow): string => {
    const lines = [
      `Name: ${t.name}`,
      `Slug: ${t.slug}`,
      `Tagline: ${t.tagline || "N/A"}`,
      `Category: ${t.categories?.name || "AI"}`,
      `Use Case: ${t.use_case || "general"}`,
      `Target Audience: ${t.target_audience || "general users"}`,
      `Average Rating: ${t.avg_rating.toFixed(1)}/5 (${t.review_count} reviews)`,
      `Pricing Model: ${t.pricing_model || "unknown"}`,
      `Pricing Details: ${t.pricing_details || "N/A"}`,
      `Description: ${(t.description || "").slice(0, 500)}`,
    ];
    return lines.join("\n");
  };

  return `Compare these two AI tools and write a verdict:\n\n--- TOOL A ---\n${formatTool(a)}\n\n--- TOOL B ---\n${formatTool(b)}`;
}

async function callAnthropic(
  system: string,
  user: string,
  retryCount = 0
): Promise<string> {
  const MAX_RETRIES = 5;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-20250414",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();

    if (res.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfter = res.headers.get("retry-after");
      const baseWait = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10000;
      const waitMs = baseWait * Math.pow(2, retryCount);
      console.warn(
        `[verdict-gen] Rate limited (attempt ${retryCount + 1}/${MAX_RETRIES}). Waiting ${Math.round(waitMs / 1000)}s...`
      );
      await sleep(waitMs);
      return callAnthropic(system, user, retryCount + 1);
    }

    throw new Error(`Anthropic ${res.status}: ${errBody}`);
  }

  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return (json.content?.[0]?.text || "").trim();
}

async function callXai(
  system: string,
  user: string,
  retryCount = 0
): Promise<string> {
  const MAX_RETRIES = 5;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-3-mini-fast",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();

    if (res.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfter = res.headers.get("retry-after");
      const baseWait = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10000;
      const waitMs = baseWait * Math.pow(2, retryCount);
      console.warn(
        `[verdict-gen] Rate limited (attempt ${retryCount + 1}/${MAX_RETRIES}). Waiting ${Math.round(waitMs / 1000)}s... Response: ${errBody.slice(0, 200)}`
      );
      await sleep(waitMs);
      return callXai(system, user, retryCount + 1);
    }

    throw new Error(`xAI ${res.status}: ${errBody}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (json.choices?.[0]?.message?.content || "").trim();
}

async function callLLM(system: string, user: string): Promise<string> {
  if (AI_PROVIDER === "anthropic") {
    return callAnthropic(system, user);
  }
  return callXai(system, user);
}

// ─── Validate and clean verdict HTML ────────────────────────────────────────
function cleanVerdictHtml(raw: string): string {
  let html = raw.trim();

  // Strip markdown fences
  html = html.replace(/^```(?:html)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
  html = html.trim();

  // Ensure it starts with <p> and ends with </p>
  if (!html.startsWith("<p>") && !html.startsWith("<p ")) {
    html = `<p>${html}`;
  }
  if (!html.endsWith("</p>")) {
    html = `${html}</p>`;
  }

  // Strip any dashes used as em dashes (two or more hyphens)
  html = html.replace(/\s*[-\u2013\u2014]{2,}\s*/g, ". ");
  // Strip single em dashes / en dashes used as separators
  html = html.replace(/\s*[\u2013\u2014]\s*/g, ", ");

  // Strip semicolons
  html = html.replace(/;/g, ".");

  return html;
}

function extractWinnerSlug(html: string, a: ToolRow, b: ToolRow): string | null {
  const lower = html.toLowerCase();
  const aCount =
    (lower.match(new RegExp(a.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  const bCount =
    (lower.match(new RegExp(b.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;

  // Check for strong winner signals
  const winnerPatterns = [
    /\b(clear(?:ly)? (?:the )?(?:winner|better|superior|stronger))\b/i,
    /\b(stands out as the (?:better|stronger|more))\b/i,
    /\b(outperforms|outshines|edges out|beats)\b/i,
    /\b(the (?:obvious|clear|better) choice)\b/i,
  ];

  for (const pat of winnerPatterns) {
    const match = lower.match(pat);
    if (match && match.index != null) {
      // Check which tool name appears closest before the winner phrase
      const before = lower.slice(Math.max(0, match.index - 100), match.index);
      const aLastIdx = before.lastIndexOf(a.name.toLowerCase());
      const bLastIdx = before.lastIndexOf(b.name.toLowerCase());

      if (aLastIdx > bLastIdx && aLastIdx >= 0) return a.slug;
      if (bLastIdx > aLastIdx && bLastIdx >= 0) return b.slug;
    }
  }

  // Fallback: if one tool has notably higher rating + review count
  if (a.avg_rating > b.avg_rating && a.review_count > b.review_count) return a.slug;
  if (b.avg_rating > a.avg_rating && b.review_count > a.review_count) return b.slug;

  return null;
}

// ─── Process a single pair ──────────────────────────────────────────────────
async function processPair(pair: ComparisonPair): Promise<VerdictResult> {
  const { toolA, toolB } = pair;
  const prompt = buildComparisonPrompt(toolA, toolB);
  const rawHtml = await callLLM(SYSTEM_PROMPT, prompt);
  const verdictHtml = cleanVerdictHtml(rawHtml);
  const winnerSlug = extractWinnerSlug(verdictHtml, toolA, toolB);

  return {
    tool_a_id: toolA.id,
    tool_b_id: toolB.id,
    tool_a_slug: toolA.slug,
    tool_b_slug: toolB.slug,
    verdict_html: verdictHtml,
    winner_slug: winnerSlug,
  };
}

// ─── Storage ────────────────────────────────────────────────────────────────
async function storeVerdictDb(verdict: VerdictResult): Promise<boolean> {
  const { error } = await supabase.from("tool_comparisons").upsert(
    {
      tool_a_id: verdict.tool_a_id,
      tool_b_id: verdict.tool_b_id,
      verdict_html: verdict.verdict_html,
      winner_slug: verdict.winner_slug,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tool_a_id,tool_b_id" }
  );

  if (error) {
    console.error(
      `[verdict-gen] DB insert failed for ${verdict.tool_a_slug} vs ${verdict.tool_b_slug}: ${error.message}`
    );
    return false;
  }
  return true;
}

function storeVerdictJson(verdict: VerdictResult): void {
  mkdirSync(VERDICTS_DIR, { recursive: true });

  const filename = `${verdict.tool_a_slug}_vs_${verdict.tool_b_slug}.json`;
  writeFileSync(
    join(VERDICTS_DIR, filename),
    JSON.stringify(verdict, null, 2),
    "utf8"
  );
}

function updateJsonIndex(verdicts: VerdictResult[]): void {
  if (verdicts.length === 0) return;
  mkdirSync(VERDICTS_DIR, { recursive: true });

  const indexPath = join(VERDICTS_DIR, "_index.json");
  let existing: VerdictResult[] = [];

  if (existsSync(indexPath)) {
    try {
      existing = JSON.parse(readFileSync(indexPath, "utf8"));
    } catch {
      // corrupted index, start fresh
    }
  }

  const seen = new Set(existing.map((v) => `${v.tool_a_id}::${v.tool_b_id}`));
  for (const v of verdicts) {
    const key = `${v.tool_a_id}::${v.tool_b_id}`;
    if (!seen.has(key)) {
      existing.push(v);
      seen.add(key);
    }
  }

  writeFileSync(indexPath, JSON.stringify(existing, null, 2), "utf8");
}

// ─── Utilities ──────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;

  async function worker(): Promise<void> {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("[verdict-gen] Starting comparison verdict generation");
  console.log(`[verdict-gen] Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`[verdict-gen] AI Provider: ${AI_PROVIDER === "anthropic" ? "Anthropic Claude Haiku" : "xAI Grok 3 Mini Fast"}`);
  console.log(`[verdict-gen] Top tools: ${TOP_N_TOOLS}`);
  console.log(`[verdict-gen] Concurrency: ${CONCURRENCY}`);

  // Step 1: Ensure the table exists (or fall back to JSON)
  let useDb = !JSON_FALLBACK;
  if (useDb) {
    useDb = await ensureTable();
  }

  if (!useDb) {
    console.log("[verdict-gen] Using JSON file fallback in scripts/verdicts/");
  }

  // Step 2: Fetch top 50 tools by review_count, use top N for pairs
  const topTools = await fetchTopTools(50);

  // Print the top tools
  console.log("\n[verdict-gen] Top tools by review_count:");
  for (let i = 0; i < Math.min(TOP_N_TOOLS, topTools.length); i++) {
    const t = topTools[i];
    console.log(
      `  ${(i + 1).toString().padStart(2)}. ${t.name.padEnd(25)} ${t.review_count} reviews, ${t.avg_rating.toFixed(1)} avg, ${t.pricing_model || "?"}`
    );
  }

  // Step 3: Generate pairs from top N
  const pairTools = topTools.slice(0, Math.min(TOP_N_TOOLS, topTools.length));
  const existing = await fetchExistingPairs(useDb);
  const pairs = generatePairs(pairTools, existing);

  const totalPossible = (pairTools.length * (pairTools.length - 1)) / 2;
  console.log(
    `\n[verdict-gen] ${totalPossible} total possible pairs, ${existing.size} already exist, ${pairs.length} to generate`
  );

  if (pairs.length === 0) {
    console.log("[verdict-gen] All pairs already generated. Nothing to do.");
    return;
  }

  const pairsToProcess = PAIR_LIMIT > 0 ? pairs.slice(0, PAIR_LIMIT) : pairs;
  console.log(`[verdict-gen] Processing ${pairsToProcess.length} pairs\n`);

  if (!APPLY) {
    console.log("[verdict-gen] DRY RUN: showing first 20 pairs:");
    for (let i = 0; i < Math.min(20, pairsToProcess.length); i++) {
      const p = pairsToProcess[i];
      console.log(`  ${i + 1}. ${p.toolA.name} vs ${p.toolB.name}`);
    }
    if (pairsToProcess.length > 20) {
      console.log(`  ... and ${pairsToProcess.length - 20} more`);
    }
    console.log(
      "\n[verdict-gen] Run with --apply to generate and store verdicts."
    );
    return;
  }

  // Step 4 + 5 + 6: Generate verdicts
  let successCount = 0;
  let failCount = 0;
  const allVerdicts: VerdictResult[] = [];

  const startTime = Date.now();

  await runBatch(pairsToProcess, CONCURRENCY, async (pair) => {
    const pairLabel = `${pair.toolA.name} vs ${pair.toolB.name}`;
    const idx = pairsToProcess.indexOf(pair) + 1;

    try {
      console.log(
        `[${idx}/${pairsToProcess.length}] Generating: ${pairLabel}...`
      );
      const verdict = await processPair(pair);

      // Validate minimum content
      if (verdict.verdict_html.length < 100) {
        console.warn(`  WARN: Verdict too short (${verdict.verdict_html.length} chars), skipping`);
        failCount++;
        return;
      }

      // Store
      if (useDb) {
        const ok = await storeVerdictDb(verdict);
        if (ok) {
          successCount++;
          allVerdicts.push(verdict);
          const winnerInfo = verdict.winner_slug
            ? ` (winner: ${verdict.winner_slug})`
            : " (no clear winner)";
          console.log(`  OK: ${verdict.verdict_html.length} chars${winnerInfo}`);
        } else {
          failCount++;
          // Fallback: also save as JSON
          storeVerdictJson(verdict);
          console.log(`  Saved as JSON fallback`);
        }
      } else {
        storeVerdictJson(verdict);
        allVerdicts.push(verdict);
        successCount++;
        const winnerInfo = verdict.winner_slug
          ? ` (winner: ${verdict.winner_slug})`
          : " (no clear winner)";
        console.log(`  OK: ${verdict.verdict_html.length} chars${winnerInfo}`);
      }

      // Brief delay to avoid hammering the API
      await sleep(200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAIL: ${pairLabel}: ${msg}`);
      failCount++;
    }
  });

  // Update JSON index if we wrote any JSON files
  if (!useDb && allVerdicts.length > 0) {
    updateJsonIndex(allVerdicts);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[verdict-gen] Done in ${elapsed}s`);
  console.log(`[verdict-gen] Success: ${successCount}, Failed: ${failCount}`);

  if (!useDb) {
    console.log(
      `[verdict-gen] Verdicts saved to: ${VERDICTS_DIR}/ (${allVerdicts.length} files + _index.json)`
    );
  }

  // Print a sample verdict
  if (allVerdicts.length > 0) {
    const sample = allVerdicts[0];
    console.log(`\n[verdict-gen] Sample verdict: ${sample.tool_a_slug} vs ${sample.tool_b_slug}`);
    console.log(`Winner: ${sample.winner_slug || "none"}`);
    console.log(sample.verdict_html);
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[verdict-gen] Fatal: ${msg}`);
  process.exit(1);
});
