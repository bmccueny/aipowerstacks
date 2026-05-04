import pkg from "pg";
const { Client } = pkg;
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // Strip surrounding quotes
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      // Remove literal \n from Vercel env format
      val = val.replace(/\\n/g, "").trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (_e) {
    /* ignore */
  }
}
loadEnv();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres";

const anthropicKey = (process.env.ANTHROPIC_API_KEY || "")
  .replace(/\\n/g, "")
  .replace(/^"|"$/g, "")
  .trim();

const VALID_USE_CASES = [
  "coding",
  "content-creation",
  "marketing",
  "design",
  "research",
  "video",
  "sales",
  "customer-support",
  "productivity",
  "audio",
  "data-analysis",
  "security",
  "education",
  "writing",
] as const;

type UseCase = (typeof VALID_USE_CASES)[number];

interface ToolRow {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  category_id: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
}

interface ClassificationResult {
  name: string;
  use_case: UseCase;
  use_cases: string[];
}

async function callClaude(
  tools: ToolRow[],
  categoryMap: Map<string, string>
): Promise<ClassificationResult[]> {
  const toolDescriptions = tools
    .map((t) => {
      const cat = t.category_id ? categoryMap.get(t.category_id) || "Unknown" : "Unknown";
      return `- "${t.name}" | Category: ${cat} | Tagline: ${t.tagline || "N/A"} | Description: ${(t.description || "N/A").slice(0, 200)}`;
    })
    .join("\n");

  const prompt = `You are classifying AI tools. For each tool below, assign:
1. A single primary \`use_case\` from this exact list: ${VALID_USE_CASES.join(", ")}
2. An array of 2-4 specific \`use_cases\` capabilities (e.g. "Code Generation", "Video Editing", "Image Generation", "Email Automation", "Data Visualization", "Voice Synthesis", "Text Summarization", etc.) — use Title Case, be specific to what the tool actually does.

Tools:
${toolDescriptions}

Respond with ONLY a JSON array. Each element: {"name": "exact tool name", "use_case": "primary-category", "use_cases": ["Capability 1", "Capability 2", ...]}
No explanation. No markdown fences. Just the JSON array.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text: string = data.content[0].text.trim();

  // Parse — handle possible markdown fences
  const jsonStr = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed: ClassificationResult[] = JSON.parse(jsonStr);

  // Validate use_case values
  for (const item of parsed) {
    if (!VALID_USE_CASES.includes(item.use_case as UseCase)) {
      // Find closest match or default to productivity
      item.use_case = "productivity";
    }
    if (!Array.isArray(item.use_cases) || item.use_cases.length === 0) {
      item.use_cases = [item.use_case];
    }
  }

  return parsed;
}

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to database\n");

    // Fetch categories
    const catRes = await client.query("SELECT id, name FROM public.categories");
    const categoryMap = new Map<string, string>();
    for (const row of catRes.rows as CategoryRow[]) {
      categoryMap.set(row.id, row.name);
    }
    console.log(`Loaded ${categoryMap.size} categories`);

    // Fetch tools with null use_case
    const toolRes = await client.query(
      `SELECT id, name, slug, tagline, description, category_id
       FROM public.tools
       WHERE use_case IS NULL
       ORDER BY name ASC`
    );
    const tools = toolRes.rows as ToolRow[];
    console.log(`Found ${tools.length} tools with NULL use_case\n`);

    if (tools.length === 0) {
      console.log("Nothing to do.");
      return;
    }

    const BATCH_SIZE = 30;
    const totalBatches = Math.ceil(tools.length / BATCH_SIZE);
    let totalUpdated = 0;
    let totalFailed = 0;
    const useCaseCounts: Record<string, number> = {};

    for (let i = 0; i < tools.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const batch = tools.slice(i, i + BATCH_SIZE);
      console.log(
        `\n--- Batch ${batchNum}/${totalBatches} (${batch.length} tools) ---`
      );
      console.log(
        `  Tools: ${batch.map((t) => t.name).join(", ")}`
      );

      let results: ClassificationResult[];
      try {
        results = await callClaude(batch, categoryMap);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ERROR calling Claude: ${msg}`);
        totalFailed += batch.length;
        continue;
      }

      // Build a lookup by name (lowercased for fuzzy matching)
      const resultMap = new Map<string, ClassificationResult>();
      for (const r of results) {
        resultMap.set(r.name.toLowerCase(), r);
      }

      for (const tool of batch) {
        const classification =
          resultMap.get(tool.name.toLowerCase()) ||
          resultMap.get(tool.name.toLowerCase().replace(/\./g, ""));

        if (!classification) {
          console.log(`  SKIP: No classification returned for "${tool.name}"`);
          totalFailed++;
          continue;
        }

        try {
          await client.query(
            `UPDATE public.tools
             SET use_case = $1, use_cases = $2
             WHERE id = $3`,
            [classification.use_case, classification.use_cases, tool.id]
          );
          totalUpdated++;
          useCaseCounts[classification.use_case] =
            (useCaseCounts[classification.use_case] || 0) + 1;
          console.log(
            `  OK: ${tool.name} -> ${classification.use_case} [${classification.use_cases.join(", ")}]`
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  DB ERROR for "${tool.name}": ${msg}`);
          totalFailed++;
        }
      }

      // Rate limit: small pause between batches
      if (i + BATCH_SIZE < tools.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.log("\n========================================");
    console.log("SUMMARY");
    console.log("========================================");
    console.log(`Total tools processed: ${tools.length}`);
    console.log(`Successfully updated:  ${totalUpdated}`);
    console.log(`Failed/skipped:        ${totalFailed}`);
    console.log("\nBreakdown by use_case:");
    const sorted = Object.entries(useCaseCounts).sort((a, b) => b[1] - a[1]);
    for (const [uc, count] of sorted) {
      console.log(`  ${uc}: ${count}`);
    }
    console.log("========================================");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Fatal error:", msg);
  } finally {
    await client.end();
  }
}

main();
