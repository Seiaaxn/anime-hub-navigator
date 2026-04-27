import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, Heart, Play, Calendar, Star, Users, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { fetchDetail, type AniDetail } from "@/lib/anilist";
import { SiteHeader } from "@/components/SiteHeader";
import type { AnimeCard } from "@/data/anime";

const stripHtml = (s: string | null) => (s || "").replace(/<br\s*\/?>(\s*)/gi, "\n").replace(/<[^>]+>/g, "").trim();

const Detail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { isFavorite, toggle } = useFavorites();

  const [data, setData] = useState<AniDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEp, setSelectedEp] = useState(1);

  useEffect(() => {
    if (!id) return;
    const anilistId = parseInt(id.replace("anilist-", ""), 10);
    if (!anilistId) { nav("/"); return; }
    setLoading(true);
    fetchDetail(anilistId).then(setData).catch((e) => {
      toast.error("Gagal memuat detail", { description: e.message });
    }).finally(() => setLoading(false));
  }, [id, nav]);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!data) return null;

  const card: AnimeCard = {
    id: `anilist-${data.id}`,
    title: data.title.english || data.title.romaji,
    jpTitle: data.title.native || undefined,
    type: (data.format === "MOVIE" ? "MOVIE" : data.format === "ONA" ? "ONA" : data.format === "OVA" ? "OVA" : "TV"),
    episodes: data.episodes ?? data.nextAiringEpisode?.episode ?? 0,
    year: data.seasonYear ?? new Date().getFullYear(),
    cover: data.coverImage.extraLarge || data.coverImage.large,
    banner: data.bannerImage || data.coverImage.extraLarge || data.coverImage.large,
    synopsis: stripHtml(data.description),
    genres: data.genres,
  };

  const totalEpisodes = card.episodes || data.streamingEpisodes.length || 12;
  const fav = isFavorite(card.id);

  const handleFav = async () => {
    const r = await toggle(card);
    if (r.needAuth) {
      toast.message("Login diperlukan", {
        description: "Masuk untuk menyimpan ke My List.",
        action: { label: "Login", onClick: () => nav("/auth") },
      });
      return;
    }
    if (r.action === "added") {
      toast.success("Disimpan ke My List", { description: card.title });
    } else if (r.action === "removed") {
      toast.success("Dihapus dari My List", { description: card.title });
    } else if (r.action === "error") {
      toast.error("Gagal memperbarui My List", { description: r.error });
    }
  };

  const handleWatch = (ep: number) => {
    setSelectedEp(ep);
    nav(`/watch/${card.id}/${ep}`);
  };

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={(q) => nav(`/?q=${encodeURIComponent(q)}`)} />

      {/* HERO */}
      <div className="relative">
        <div className="absolute inset-0 h-[420px] sm:h-[520px] overflow-hidden">
          <img src={card.banner} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>

        <div className="relative max-w-7xl mx-auto px-3 sm:px-5 pt-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" /> Beranda
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 pt-6">
            <img src={card.cover} alt={card.title} className="w-40 sm:w-48 rounded-2xl border border-border shadow-2xl" />

            <div className="space-y-4">
              <div>
                <h1 className="display text-3xl sm:text-5xl font-black leading-tight">{card.title}</h1>
                {card.jpTitle && <p className="text-sm text-muted-foreground mt-1">{card.jpTitle}</p>}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-primary text-primary-foreground font-bold">HD</span>
                <span className="px-2 py-1 rounded bg-secondary border border-border">{card.type}</span>
                <span className="px-2 py-1 rounded bg-secondary border border-border">{card.year}</span>
                {data.duration && <span className="px-2 py-1 rounded bg-secondary border border-border flex items-center gap-1"><Clock className="h-3 w-3" />{data.duration}m</span>}
                {data.averageScore && <span className="px-2 py-1 rounded bg-secondary border border-border flex items-center gap-1"><Star className="h-3 w-3 text-primary" />{data.averageScore}</span>}
                {data.favourites && <span className="px-2 py-1 rounded bg-secondary border border-border flex items-center gap-1"><Heart className="h-3 w-3 text-[hsl(var(--neon-pink))]" />{data.favourites.toLocaleString()}</span>}
                {data.popularity && <span className="px-2 py-1 rounded bg-secondary border border-border flex items-center gap-1"><Users className="h-3 w-3" />{data.popularity.toLocaleString()}</span>}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {card.genres.map((g) => (
                  <span key={g} className="text-[11px] px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground">{g}</span>
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl whitespace-pre-line">{card.synopsis}</p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => handleWatch(selectedEp)} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold glow-cyan">
                  <Play className="h-4 w-4 mr-2 fill-current" /> WATCH EP {selectedEp}
                </Button>
                <Button onClick={handleFav} variant="outline" className={`h-11 rounded-xl border-border font-bold ${fav ? "bg-[hsl(var(--neon-pink))]/15 text-[hsl(var(--neon-pink))] border-[hsl(var(--neon-pink))]" : ""}`}>
                  <Heart className={`h-4 w-4 mr-2 ${fav ? "fill-current" : ""}`} /> {fav ? "Saved" : "My List"}
                </Button>
              </div>

              {data.nextAiringEpisode && (
                <div className="flex items-center gap-2 text-xs text-primary mono pt-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Ep {data.nextAiringEpisode.episode} dalam {Math.floor(data.nextAiringEpisode.timeUntilAiring / 3600)}j {Math.floor((data.nextAiringEpisode.timeUntilAiring % 3600) / 60)}m
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-5 mt-10 space-y-10">
        {/* EPISODE LIST */}
        <section>
          <h2 className="display text-2xl font-black mb-4 flex items-center gap-3">
            <span className="h-6 w-1.5 rounded-full bg-primary" /> Episode
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {Array.from({ length: totalEpisodes }).map((_, i) => {
              const ep = i + 1;
              const active = ep === selectedEp;
              return (
                <button key={ep} onClick={() => handleWatch(ep)}
                  className={`aspect-square rounded-xl font-black text-sm border transition ${active ? "bg-primary text-primary-foreground border-primary glow-cyan" : "bg-secondary border-border hover:border-primary hover:text-primary"}`}>
                  {ep}
                </button>
              );
            })}
          </div>
        </section>

        {/* AIRING SCHEDULE */}
        {data.nextAiringEpisode && (
          <section className="bg-card-grad rounded-2xl p-5">
            <h2 className="display text-xl font-black mb-3 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" /> Jadwal Berikutnya
            </h2>
            <p className="text-sm text-muted-foreground">
              Episode <span className="text-primary font-bold">{data.nextAiringEpisode.episode}</span> tayang pada{" "}
              <span className="text-foreground font-semibold">
                {new Date(data.nextAiringEpisode.airingAt * 1000).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
              </span>
            </p>
          </section>
        )}

        {/* INFO */}
        <section className="bg-card-grad rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Info label="Status" value={data.status?.replace(/_/g, " ") || "-"} />
          <Info label="Studio" value={data.studios.nodes[0]?.name || "-"} />
          <Info label="Season" value={data.season ? `${data.season} ${data.seasonYear}` : "-"} />
          <Info label="Episodes" value={String(data.episodes ?? "?")} />
        </section>
      </main>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-bold capitalize">{value}</p>
  </div>
);

export default Detail;
