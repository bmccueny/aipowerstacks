#!/usr/bin/env npx tsx
/**
 * enrich-descriptions-v2.ts
 *
 * Resumes the tool description enrichment job.
 * Queries all published tools with NULL or short descriptions,
 * sends batches of 15 to Claude Haiku for SEO description generation,
 * and updates each tool in Supabase.
 *
 * Usage:
 *   npx tsx scripts/enrich-descriptions-v2.ts
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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
  console.warn(".env.local not found -- falling back to system env");
}

// ─── Config ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  .replace(/\\n/g, "")
  .trim();
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "")
  .replace(/\\n/g, "")
  .trim();
// Try process.env first, then fall back to reading from systemd service file
let ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || "")
  .replace(/\\n/g, "")
  .trim();

if (!ANTHROPIC_API_KEY) {
  try {
    const serviceFile = readFileSync(
      join(process.env.HOME || "/home/bm", ".config/systemd/user/openclaw-gateway.service"),
      "utf8"
    );
    const match = serviceFile.match(/ANTHROPIC_API_KEY=(\S+)/);
    if (match) {
      ANTHROPIC_API_KEY = match[1].trim();
    }
  } catch {
    // silently fail, will error below
  }
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MIN_DESCRIPTION_LENGTH = 200;
const BATCH_SIZE = 15;
const MODEL = "claude-haiku-4-5-20251001";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Tool {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  use_case: string | null;
  pricing_model: string | null;
  categories: { name: string } | null;
}

interface EnrichedResult {
  id: string;
  name: string;
  description: string;
}

// ─── Fetch all published tools with thin descriptions ───────────────────────
async function fetchThinTools(): Promise<Tool[]> {
  console.log("Fetching published tools with thin/missing descriptions...");
  const allTools: Tool[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("tools")
      .select(
        "id, name, tagline, description, use_case, pricing_model, categories(name)"
      )
      .eq("status", "published")
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Supabase query error:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allTools.push(...(data as Tool[]));
    offset += pageSize;
  }

  const thin = allTools.filter(
    (t) => !t.description || t.description.length < MIN_DESCRIPTION_LENGTH
  );

  console.log(`Total published: ${allTools.length}`);
  console.log(
    `Need enrichment (NULL or < ${MIN_DESCRIPTION_LENGTH} chars): ${thin.length}`
  );

  return thin;
}

// ─── System prompt ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an SEO copywriter for an AI tools directory called AI Power Stacks. Write compelling, factual product descriptions.

Rules:
- Each description must be 200-300 words
- Start with what the tool DOES, never "X is a tool that..."
- Include the tool name naturally 2-3 times
- Mention key features, pricing model, and target audience
- Use keywords people would search for (e.g. "AI writing assistant", "code generation tool")
- Be factual -- only use information from the provided tagline, category, use case, and existing description
- Do NOT invent features, integrations, or statistics not mentioned in the input
- Write in present tense, active voice
- Each description should feel unique, not templated

Output format -- return ONLY a JSON array (no markdown fences, no explanation, no trailing text):
[
  { "id": "...", "name": "...", "description": "..." }
]`;

function buildUserPrompt(tools: Tool[]): string {
  const toolEntries = tools
    .map((t, i) => {
      const category = t.categories?.name || "AI";
      const pricing = t.pricing_model || "unknown pricing";
      const useCase = t.use_case || "general";
      const tagline = t.tagline || "AI tool";
      const existingDesc = t.description || "";
      return `TOOL ${i + 1}:
ID: ${t.id}
Name: ${t.name}
Tagline: ${tagline}
Category: ${category}
Use Case: ${useCase}
Pricing Model: ${pricing}
Existing Description: ${existingDesc}`;
    })
    .join("\n\n");

  return `Write SEO-optimized descriptions for each of these AI tools:\n\n${toolEntries}`;
}

// ─── Anthropic API call ────────────────────────────────────────────────────
async function callHaiku(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16384,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errBody}`);
  }

  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return json.content?.[0]?.text || "";
}

// ─── Parse LLM response into results ───────────────────────────────────────
function parseResponse(text: string, batchTools: Tool[]): EnrichedResult[] {
  let jsonStr = text.trim();

  // Strip markdown code fences if present
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

  const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("  Failed to parse JSON from LLM response:");
    console.error("  " + text.slice(0, 300));
    return [];
  }
  jsonStr = jsonMatch[0];

  // Fix common JSON issues: trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");

  let parsed: EnrichedResult[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err: unknown) {
    console.error(
      "  JSON parse error:",
      err instanceof Error ? err.message : String(err)
    );
    console.error("  Raw:", jsonStr.slice(0, 400));
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("  Response is not an array");
    return [];
  }

  return parsed.filter((r) => {
    if (!r.id || !r.description) {
      console.warn(`    Skipping invalid result for ${r.name || "unknown"}`);
      return false;
    }

    // Verify ID matches one of our batch tools
    const matchedTool = batchTools.find((t) => t.id === r.id);
    if (!matchedTool) {
      // Try matching by name instead (LLMs sometimes hallucinate IDs)
      const byName = batchTools.find(
        (t) => t.name.toLowerCase() === (r.name || "").toLowerCase()
      );
      if (byName) {
        r.id = byName.id;
        r.name = byName.name;
      } else {
        console.warn(`    ID ${r.id} not found in batch -- skipping`);
        return false;
      }
    }

    const wordCount = r.description.split(/\s+/).length;
    if (wordCount < 80) {
      console.warn(
        `    Description too short for ${r.name}: ${wordCount} words`
      );
      return false;
    }
    if (wordCount > 400) {
      console.warn(
        `    Description too long for ${r.name}: ${wordCount} words -- truncating`
      );
      const sentences = r.description.split(/(?<=[.!?])\s+/);
      let truncated = "";
      for (const sentence of sentences) {
        if ((truncated + " " + sentence).split(/\s+/).length > 300) break;
        truncated += (truncated ? " " : "") + sentence;
      }
      r.description = truncated;
    }
    return true;
  });
}

// ─── Update tool in Supabase ────────────────────────────────────────────────
async function updateTool(id: string, description: string): Promise<boolean> {
  const { error } = await supabase
    .from("tools")
    .update({ description })
    .eq("id", id);

  if (error) {
    console.error(`  DB update failed for ${id}: ${error.message}`);
    return false;
  }
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  enrich-descriptions-v2 — Claude Haiku enrichment");
  console.log(`  Model: ${MODEL}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log("═══════════════════════════════════════════════════════\n");

  const tools = await fetchThinTools();
  if (tools.length === 0) {
    console.log("\nAll tools already have descriptions >= 200 chars. Done!");
    return;
  }

  // Split into batches of BATCH_SIZE
  const batches: Tool[][] = [];
  for (let i = 0; i < tools.length; i += BATCH_SIZE) {
    batches.push(tools.slice(i, i + BATCH_SIZE));
  }

  let totalEnriched = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(
      `\n[${elapsed}s] Batch ${b + 1} of ${batches.length} (${batch.length} tools)`
    );
    console.log(
      `  Tools: ${batch.map((t) => t.name).join(", ")}`
    );

    let results: EnrichedResult[];
    try {
      results = await enrichBatch(batch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Batch ${b + 1} error: ${msg}`);

      // Handle rate limits with exponential backoff
      if (msg.includes("429") || msg.includes("rate") || msg.includes("overloaded")) {
        const waitSecs = msg.includes("overloaded") ? 30 : 60;
        console.log(`  Rate limited — waiting ${waitSecs}s before retry...`);
        await sleep(waitSecs * 1000);
        try {
          results = await enrichBatch(batch);
        } catch (retryErr: unknown) {
          console.error(
            `  Retry failed: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`
          );
          totalFailed += batch.length;
          continue;
        }
      } else {
        totalFailed += batch.length;
        continue;
      }
    }

    console.log(`  Generated ${results.length}/${batch.length} descriptions`);
    totalEnriched += results.length;
    totalFailed += batch.length - results.length;

    // Update each tool in DB
    for (const result of results) {
      const wordCount = result.description.split(/\s+/).length;
      const charCount = result.description.length;
      const ok = await updateTool(result.id, result.description);
      if (ok) {
        console.log(
          `  ✓ ${result.name}: ${wordCount} words, ${charCount} chars`
        );
        totalUpdated++;
      } else {
        totalFailed++;
      }
    }

    // Small pause between batches to respect rate limits
    if (b < batches.length - 1) {
      await sleep(1500);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n═══════════════════════════════════════════════════════");
  console.log(`  Tools needing enrichment: ${tools.length}`);
  console.log(`  Descriptions generated:   ${totalEnriched}`);
  console.log(`  Successfully updated:     ${totalUpdated}`);
  console.log(`  Failed/skipped:           ${totalFailed}`);
  console.log(`  Total time:               ${totalTime}s`);
  console.log("═══════════════════════════════════════════════════════");
}

async function enrichBatch(tools: Tool[]): Promise<EnrichedResult[]> {
  const userPrompt = buildUserPrompt(tools);
  const text = await callHaiku(SYSTEM_PROMPT, userPrompt);
  return parseResponse(text, tools);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
