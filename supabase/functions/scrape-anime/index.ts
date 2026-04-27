// Scrape anime info from public sources via Firecrawl + structure with Lovable AI
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Mode = "search" | "detail";

interface Body {
  mode: Mode;
  query?: string;       // for search
  url?: string;         // for detail
  sources?: string[];   // optional domain hints
}

const DEFAULT_SOURCES = [
  "otakudesu.cloud",
  "samehadaku.email",
  "anoboy.cyou",
  "kuramanime.boo",
  "anitaku.bz",
  "gogoanime.by",
  "gogoanime3.co",
  "gogoanime.tel",
  "alqanime.net",
  "nimegami.id",
  "neonime.lat",
  "anikyojin.net",
  "oploverz.cyou",
];

async function firecrawlSearch(query: string, sources: string[]) {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");

  const siteFilter = sources.map((s) => `site:${s}`).join(" OR ");
  const fullQuery = `${query} anime episode ${siteFilter ? `(${siteFilter})` : ""}`.trim();

  const res = await fetch(`${FIRECRAWL_BASE}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: fullQuery, limit: 12 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl search failed [${res.status}]: ${JSON.stringify(data)}`);
  // v2 returns { success, data: { web: [...] } } or { data: [...] }
  const web = data?.data?.web ?? data?.data ?? [];
  return web.map((r: any) => ({
    url: r.url,
    title: r.title,
    description: r.description,
  }));
}

async function firecrawlScrape(url: string) {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");

  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown", "links"],
      onlyMainContent: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl scrape failed [${res.status}]: ${JSON.stringify(data)}`);
  return {
    markdown: data?.data?.markdown ?? data?.markdown ?? "",
    links: data?.data?.links ?? data?.links ?? [],
    metadata: data?.data?.metadata ?? data?.metadata ?? {},
  };
}

async function aiStructure(systemPrompt: string, userText: string, schema: any, name: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText.slice(0, 60000) },
      ],
      tools: [{ type: "function", function: { name, description: "Return structured data", parameters: schema } }],
      tool_choice: { type: "function", function: { name } },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 429) throw new Error("AI rate limit exceeded, please retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway error [${res.status}]: ${JSON.stringify(data)}`);
  }
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("AI returned no structured output");
  return JSON.parse(call.function.arguments);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const sources = body.sources?.length ? body.sources : DEFAULT_SOURCES;

    if (body.mode === "search") {
      if (!body.query || body.query.trim().length < 2) {
        return new Response(JSON.stringify({ error: "query required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const raw = await firecrawlSearch(body.query, sources);

      // Use AI to clean & dedupe into anime entries
      const structured = await aiStructure(
        "You curate anime search results. From the raw web results, extract distinct anime titles. Skip duplicates and obvious non-anime pages. Prefer entries that look like an anime series page (not an individual episode).",
        JSON.stringify(raw),
        {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  source: { type: "string", description: "domain name" },
                  snippet: { type: "string" },
                },
                required: ["title", "url", "source"],
                additionalProperties: false,
              },
            },
          },
          required: ["results"],
          additionalProperties: false,
        },
        "curate_results",
      );

      return new Response(JSON.stringify(structured), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "detail") {
      if (!body.url) {
        return new Response(JSON.stringify({ error: "url required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const scraped = await firecrawlScrape(body.url);

      const structured = await aiStructure(
        `You extract anime details from a scraped page. Identify the anime title, synopsis, cover image URL, and the episode list with absolute URLs to each episode page. Also try to find any direct video iframe/embed URLs present in the markdown or links (look for mp4, m3u8, /embed/, /e/, player.*). Be permissive.`,
        `URL: ${body.url}\n\nMARKDOWN:\n${scraped.markdown}\n\nLINKS:\n${(scraped.links || []).slice(0, 200).join("\n")}`,
        {
          type: "object",
          properties: {
            title: { type: "string" },
            synopsis: { type: "string" },
            coverImage: { type: "string" },
            genres: { type: "array", items: { type: "string" } },
            episodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  number: { type: "string" },
                  title: { type: "string" },
                  url: { type: "string" },
                },
                required: ["number", "url"],
                additionalProperties: false,
              },
            },
            embedUrls: { type: "array", items: { type: "string" } },
          },
          required: ["title", "episodes"],
          additionalProperties: false,
        },
        "extract_anime",
      );

      return new Response(JSON.stringify(structured), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "invalid mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("scrape-anime error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
