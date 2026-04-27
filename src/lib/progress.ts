import { supabase } from "@/integrations/supabase/client";
import type { AnimeCard } from "@/data/anime";

export async function saveProgress(userId: string, a: AnimeCard, episode: number, embedUrl?: string) {
  await supabase.from("watch_progress").upsert({
    user_id: userId,
    anime_id: a.id,
    title: a.title,
    cover: a.cover,
    episode,
    embed_url: embedUrl,
  }, { onConflict: "user_id,anime_id" });
}

export async function getProgressList(userId: string, limit = 50, offset = 0) {
  const { data } = await supabase
    .from("watch_progress")
    .select("anime_id,title,cover,episode,embed_url,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return data || [];
}

export async function countProgress(userId: string) {
  const { count } = await supabase
    .from("watch_progress")
    .select("anime_id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count || 0;
}

export async function getProgress(userId: string, animeId: string) {
  const { data } = await supabase
    .from("watch_progress")
    .select("episode,embed_url")
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .maybeSingle();
  return data;
}
