// Sankavollerei anime API client (no scraping).
// Used for genre navigation. If the upstream is unreachable, callers should fall back gracefully.

const BASE = "https://www.sankavollerei.com/anime";

export type SankaAnime = {
  title: string;
  poster: string;
  type?: string;
  score?: string;
  status?: string;
  animeId: string;
  href?: string;
};

export type SankaGenre = {
  title: string;
  genreId: string;
};

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Sanka ${res.status}`);
  const json = await res.json();
  if (json?.status && json.status !== "success") throw new Error(json.message || "API error");
  return json.data as T;
}

/** All genres (samehadaku source — most reliable). */
export async function fetchGenres(signal?: AbortSignal): Promise<SankaGenre[]> {
  const data = await getJSON<{ genreList: SankaGenre[] }>(`${BASE}/samehadaku/genres`, signal);
  return data.genreList || [];
}

/** Anime list for a given genre slug. */
export async function fetchGenreAnime(slug: string, signal?: AbortSignal): Promise<SankaAnime[]> {
  const data = await getJSON<{ animeList: SankaAnime[] }>(
    `${BASE}/samehadaku/genres/${encodeURIComponent(slug)}`,
    signal,
  );
  return data.animeList || [];
}
