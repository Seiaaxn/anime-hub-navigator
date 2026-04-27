// AniList GraphQL client — public API, no key required.
import type { AnimeCard } from "@/data/anime";

const ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  type
  format
  episodes
  seasonYear
  description(asHtml: false)
  genres
  averageScore
  bannerImage
  coverImage { large extraLarge color }
  nextAiringEpisode { episode airingAt }
`;

type AniMedia = {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  format: string | null;
  episodes: number | null;
  seasonYear: number | null;
  description: string | null;
  genres: string[];
  averageScore: number | null;
  bannerImage: string | null;
  coverImage: { large: string; extraLarge: string | null; color: string | null };
  nextAiringEpisode: { episode: number; airingAt: number } | null;
};

const stripHtml = (s: string | null) =>
  (s || "").replace(/<br\s*\/?>(\s*)/gi, " ").replace(/<[^>]+>/g, "").trim();

const mapType = (f: string | null): AnimeCard["type"] => {
  if (f === "MOVIE") return "MOVIE";
  if (f === "ONA") return "ONA";
  if (f === "OVA") return "OVA";
  return "TV";
};

const toCard = (m: AniMedia): AnimeCard => ({
  id: `anilist-${m.id}`,
  title: m.title.english || m.title.romaji,
  jpTitle: m.title.native || undefined,
  type: mapType(m.format),
  episodes: m.episodes ?? m.nextAiringEpisode?.episode ?? 0,
  year: m.seasonYear ?? new Date().getFullYear(),
  cover: m.coverImage.extraLarge || m.coverImage.large,
  banner: m.bannerImage || m.coverImage.extraLarge || m.coverImage.large,
  synopsis: stripHtml(m.description).slice(0, 300),
  genres: m.genres.slice(0, 4),
  rating: "HD",
  sub: m.episodes ?? undefined,
  dub: 0,
});

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "AniList error");
  return json.data;
}

const PAGE_QUERY = `
  query ($sort: [MediaSort], $status: MediaStatus, $perPage: Int) {
    Page(perPage: $perPage) {
      media(sort: $sort, type: ANIME, status: $status, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export async function fetchAniListSection(
  sort: string[],
  perPage = 12,
  status?: "RELEASING" | "FINISHED" | "NOT_YET_RELEASED",
): Promise<AnimeCard[]> {
  const data = await gql<{ Page: { media: AniMedia[] } }>(PAGE_QUERY, {
    sort, perPage, status,
  });
  return data.Page.media.map(toCard);
}

export async function fetchHomeData() {
  const [trending, topAiring, popular, favorites, completed, spotlight] = await Promise.all([
    fetchAniListSection(["TRENDING_DESC"], 14),
    fetchAniListSection(["POPULARITY_DESC"], 6, "RELEASING"),
    fetchAniListSection(["POPULARITY_DESC"], 6),
    fetchAniListSection(["FAVOURITES_DESC"], 6),
    fetchAniListSection(["END_DATE_DESC"], 6, "FINISHED"),
    fetchAniListSection(["TRENDING_DESC"], 6, "RELEASING"),
  ]);
  return { trending, topAiring, popular, favorites, completed, spotlight };
}

const SEARCH_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export async function searchAniList(q: string, perPage = 20): Promise<AnimeCard[]> {
  const data = await gql<{ Page: { media: AniMedia[] } }>(SEARCH_QUERY, { search: q, perPage });
  return data.Page.media.map(toCard);
}

const SCHEDULE_QUERY = `
  query ($start: Int, $end: Int, $perPage: Int) {
    Page(perPage: $perPage) {
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        episode
        airingAt
        media { id title { romaji english } coverImage { large } }
      }
    }
  }
`;

export type ScheduleItem = { id: string; title: string; ep: number; time: string; cover: string };

export async function fetchSchedule(): Promise<ScheduleItem[]> {
  const now = Math.floor(Date.now() / 1000);
  const end = now + 86400;
  const data = await gql<{
    Page: { airingSchedules: { episode: number; airingAt: number; media: { id: number; title: { romaji: string; english: string | null }; coverImage: { large: string } } }[] };
  }>(SCHEDULE_QUERY, { start: now, end, perPage: 12 });
  return data.Page.airingSchedules.map((s) => ({
    id: `sched-${s.media.id}-${s.episode}`,
    title: s.media.title.english || s.media.title.romaji,
    ep: s.episode,
    cover: s.media.coverImage.large,
    time: new Date(s.airingAt * 1000).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
  }));
}

const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      format
      episodes
      duration
      seasonYear
      season
      status
      description(asHtml: false)
      genres
      averageScore
      meanScore
      popularity
      favourites
      bannerImage
      coverImage { large extraLarge color }
      studios(isMain: true) { nodes { name } }
      nextAiringEpisode { episode airingAt timeUntilAiring }
      streamingEpisodes { title thumbnail url site }
    }
  }
`;

export type AniDetail = {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  format: string | null;
  episodes: number | null;
  duration: number | null;
  seasonYear: number | null;
  season: string | null;
  status: string | null;
  description: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  favourites: number | null;
  bannerImage: string | null;
  coverImage: { large: string; extraLarge: string | null; color: string | null };
  studios: { nodes: { name: string }[] };
  nextAiringEpisode: { episode: number; airingAt: number; timeUntilAiring: number } | null;
  streamingEpisodes: { title: string; thumbnail: string; url: string; site: string }[];
};

export async function fetchDetail(anilistId: number): Promise<AniDetail> {
  const data = await gql<{ Media: AniDetail }>(DETAIL_QUERY, { id: anilistId });
  return data.Media;
}
