#!/usr/bin/env npx tsx
/**
 * Enrich thin tool descriptions using a local Ollama model.
 *
 * Finds all published tools with NULL or < 200-char descriptions,
 * batches them in groups of 5, generates SEO-optimized 200-300 word
 * descriptions via Ollama (qwen2.5-coder:32b), and updates each tool
 * in Supabase.
 *
 * Falls back to Anthropic API if --provider=anthropic is passed and
 * ANTHROPIC_API_KEY is available.
 *
 * Usage:
 *   npx tsx scripts/enrich-descriptions.ts              # dry run (Ollama)
 *   npx tsx scripts/enrich-descriptions.ts --apply       # write to DB
 *   npx tsx scripts/enrich-descriptions.ts --apply --provider=anthropic
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = !process.argv.includes("--apply");
const MIN_DESCRIPTION_LENGTH = 200;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:32b";

// Provider detection
const providerArg = process.argv
  .find((a) => a.startsWith("--provider="))
  ?.split("=")[1];
const PROVIDER = providerArg || "ollama";

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
  console.log("Fetching published tools...");
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
    `Thin descriptions (NULL or < ${MIN_DESCRIPTION_LENGTH} chars): ${thin.length}`
  );

  return thin;
}

// ─── System prompt (shared across providers) ────────────────────────────────
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

// ─── Ollama generation ──────────────────────────────────────────────────────
async function callOllama(
  system: string,
  user: string
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 8192,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as {
    message?: { content?: string };
    error?: string;
  };
  if (json.error) throw new Error(`Ollama error: ${json.error}`);
  return json.message?.content || "";
}

// ─── Anthropic generation (fallback) ────────────────────────────────────────
async function callAnthropic(
  system: string,
  user: string
): Promise<string> {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "")
    .replace(/\\n/g, "")
    .trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
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

// ─── Unified generate function ──────────────────────────────────────────────
async function generate(system: string, user: string): Promise<string> {
  if (PROVIDER === "anthropic") {
    return callAnthropic(system, user);
  }
  return callOllama(system, user);
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

  // Fix common JSON issues from LLMs: trailing commas before ] or }
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

// ─── Enrich a batch of tools ────────────────────────────────────────────────
async function enrichBatch(tools: Tool[]): Promise<EnrichedResult[]> {
  const userPrompt = buildUserPrompt(tools);
  const text = await generate(SYSTEM_PROMPT, userPrompt);
  return parseResponse(text, tools);
}

// ─── Update tool in Supabase ────────────────────────────────────────────────
async function updateTool(id: string, description: string): Promise<boolean> {
  const { error } = await supabase
    .from("tools")
    .update({ description })
    .eq("id", id);

  if (error) {
    console.error(`  DB update failed: ${error.message}`);
    return false;
  }
  return true;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== APPLYING UPDATES ===");
  console.log(`Provider: ${PROVIDER} (${PROVIDER === "ollama" ? OLLAMA_MODEL : "claude-sonnet-4"})`);
  console.log();

  // Verify Ollama connectivity
  if (PROVIDER === "ollama") {
    try {
      const check = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!check.ok) throw new Error(`HTTP ${check.status}`);
      const tags = (await check.json()) as {
        models?: Array<{ name: string }>;
      };
      const available = tags.models?.map((m) => m.name) || [];
      if (!available.some((n) => n.startsWith(OLLAMA_MODEL.split(":")[0]))) {
        console.error(
          `Model ${OLLAMA_MODEL} not found. Available: ${available.join(", ")}`
        );
        process.exit(1);
      }
      console.log(`Ollama connected. Model: ${OLLAMA_MODEL}`);
    } catch (err: unknown) {
      console.error(
        "Cannot connect to Ollama at",
        OLLAMA_URL,
        "-",
        err instanceof Error ? err.message : String(err)
      );
      process.exit(1);
    }
  }

  const tools = await fetchThinTools();
  if (tools.length === 0) {
    console.log("No tools need enrichment. Done.");
    return;
  }

  // Batch into groups of 5 for local models (smaller batches = better quality)
  const BATCH_SIZE = PROVIDER === "ollama" ? 5 : 10;
  const batches: Tool[][] = [];
  for (let i = 0; i < tools.length; i += BATCH_SIZE) {
    batches.push(tools.slice(i, i + BATCH_SIZE));
  }

  let totalEnriched = 0;
  let totalFailed = 0;
  let totalUpdated = 0;
  const startTime = Date.now();

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(
      `\n[${elapsed}s] Batch ${b + 1}/${batches.length} (${batch.length} tools): ${batch.map((t) => t.name).join(", ")}`
    );

    let results: EnrichedResult[];
    try {
      results = await enrichBatch(batch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Batch ${b + 1} error: ${msg}`);
      totalFailed += batch.length;

      if (msg.includes("rate") || msg.includes("429")) {
        console.log("  Rate limited -- waiting 60s before retry...");
        await sleep(60_000);
        try {
          results = await enrichBatch(batch);
        } catch {
          console.error("  Retry also failed. Skipping batch.");
          continue;
        }
      } else {
        continue;
      }
    }

    console.log(`  Generated ${results.length}/${batch.length} descriptions`);
    totalEnriched += results.length;
    totalFailed += batch.length - results.length;

    for (const result of results) {
      const wordCount = result.description.split(/\s+/).length;
      const charCount = result.description.length;

      if (DRY_RUN) {
        console.log(
          `  [DRY] ${result.name}: ${wordCount} words, ${charCount} chars`
        );
        console.log(`         "${result.description.slice(0, 120)}..."`);
        totalUpdated++;
      } else {
        const ok = await updateTool(result.id, result.description);
        if (ok) {
          console.log(
            `  Updated ${result.name}: ${wordCount} words, ${charCount} chars`
          );
          totalUpdated++;
        } else {
          totalFailed++;
        }
      }
    }

    // Pause between batches
    if (b < batches.length - 1) {
      await sleep(PROVIDER === "ollama" ? 500 : 1500);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n════════════════════════════════════════════════════");
  console.log(`Total tools processed:  ${tools.length}`);
  console.log(`Descriptions generated: ${totalEnriched}`);
  console.log(
    `${DRY_RUN ? "Would update" : "Updated"}:        ${totalUpdated}`
  );
  console.log(`Failed/skipped:         ${totalFailed}`);
  console.log(`Total time:             ${totalTime}s`);
  console.log("════════════════════════════════════════════════════");

  if (DRY_RUN) {
    console.log("\nThis was a dry run. Pass --apply to write to the database.");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
