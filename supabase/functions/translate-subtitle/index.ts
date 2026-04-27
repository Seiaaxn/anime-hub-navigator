// Translate WebVTT subtitles via Lovable AI
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Body {
  vtt?: string;        // raw WebVTT content
  sourceUrl?: string;  // OR a URL to fetch VTT/SRT from
  targetLang: "id" | "en" | "ja" | string;
}

function srtToVtt(srt: string) {
  return "WEBVTT\n\n" + srt.replace(/\r/g, "").replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
}

function parseCues(vtt: string) {
  const blocks = vtt.replace(/^WEBVTT.*?\n\n/s, "").split(/\n\n+/);
  return blocks
    .map((b) => {
      const lines = b.split("\n").filter(Boolean);
      const tsIdx = lines.findIndex((l) => l.includes("-->"));
      if (tsIdx === -1) return null;
      return {
        timestamp: lines[tsIdx],
        text: lines.slice(tsIdx + 1).join("\n"),
      };
    })
    .filter(Boolean) as { timestamp: string; text: string }[];
}

function buildVtt(cues: { timestamp: string; text: string }[]) {
  return "WEBVTT\n\n" + cues.map((c, i) => `${i + 1}\n${c.timestamp}\n${c.text}`).join("\n\n");
}

async function translateBatch(texts: string[], targetLang: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const langName: Record<string, string> = {
    id: "Indonesian", en: "English", ja: "Japanese",
  };
  const target = langName[targetLang] ?? targetLang;

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You translate anime subtitles. Translate each line to ${target}, keeping natural conversational tone. Return EXACTLY the same number of items, in the same order. Preserve line breaks within an item.`,
        },
        { role: "user", content: JSON.stringify(texts) },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_translations",
          description: "Return translated lines",
          parameters: {
            type: "object",
            properties: { translations: { type: "array", items: { type: "string" } } },
            required: ["translations"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_translations" } },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 429) throw new Error("AI rate limit exceeded");
    if (res.status === 402) throw new Error("AI credits exhausted");
    throw new Error(`AI error [${res.status}]: ${JSON.stringify(data)}`);
  }
  const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
  return args.translations as string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.targetLang) {
      return new Response(JSON.stringify({ error: "targetLang required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let vtt = body.vtt ?? "";
    if (!vtt && body.sourceUrl) {
      const r = await fetch(body.sourceUrl);
      const text = await r.text();
      vtt = body.sourceUrl.endsWith(".srt") || !text.startsWith("WEBVTT") ? srtToVtt(text) : text;
    }
    if (!vtt) {
      return new Response(JSON.stringify({ error: "vtt or sourceUrl required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cues = parseCues(vtt);
    if (!cues.length) {
      return new Response(JSON.stringify({ error: "no cues parsed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch in chunks of 40 cues
    const out: string[] = [];
    const CHUNK = 40;
    for (let i = 0; i < cues.length; i += CHUNK) {
      const slice = cues.slice(i, i + CHUNK).map((c) => c.text);
      const translated = await translateBatch(slice, body.targetLang);
      // Pad/truncate to keep alignment
      for (let j = 0; j < slice.length; j++) out.push(translated[j] ?? slice[j]);
    }

    const translatedCues = cues.map((c, i) => ({ timestamp: c.timestamp, text: out[i] }));
    const newVtt = buildVtt(translatedCues);

    return new Response(JSON.stringify({ vtt: newVtt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("translate-subtitle error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
