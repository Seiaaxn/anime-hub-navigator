import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDetail } from "@/lib/anilist";
import { saveProgress } from "@/lib/progress";
import type { AnimeCard } from "@/data/anime";

const SOURCES = [
  "otakudesu.cloud", "samehadaku.email", "anoboy.cyou", "kuramanime.boo",
  "anitaku.bz", "otaku.blog", "gogoanime.by", "gogoanime3.co", "gogoanime.tel",
  "alqanime.net", "nimegami.id", "neonime.lat", "anikyojin.net", "oploverz.cyou",
];

const stripHtml = (s: string | null) =>
  (s || "").replace(/<br\s*\/?>(\s*)/gi, "\n").replace(/<[^>]+>/g, "").trim();

const Watch = () => {
  const { id, ep } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const epNum = Math.max(1, parseInt(ep || "1", 10) || 1);
  const [card, setCard] = useState<AnimeCard | null>(null);
  const [totalEpisodes, setTotalEpisodes] = useState(12);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [embed, setEmbed] = useState<string | null>(null);
  const [loadingEmbed, setLoadingEmbed] = useState(false);
  const [hits, setHits] = useState<{ title: string; url: string; source: string }[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Load metadata
  useEffect(() => {
    if (!id) { nav("/"); return; }
    const anilistId = parseInt(id.replace("anilist-", ""), 10);
    if (!anilistId) { nav("/"); return; }
    setLoadingMeta(true);
    fetchDetail(anilistId)
      .then((d) => {
        const c: AnimeCard = {
          id: `anilist-${d.id}`,
          title: d.title.english || d.title.romaji,
          jpTitle: d.title.native || undefined,
          type: (d.format === "MOVIE" ? "MOVIE" : d.format === "ONA" ? "ONA" : d.format === "OVA" ? "OVA" : "TV"),
          episodes: d.episodes ?? d.nextAiringEpisode?.episode ?? 0,
          year: d.seasonYear ?? new Date().getFullYear(),
          cover: d.coverImage.extraLarge || d.coverImage.large,
          banner: d.bannerImage || d.coverImage.extraLarge || d.coverImage.large,
          synopsis: stripHtml(d.description),
          genres: d.genres,
        };
        setCard(c);
        setTotalEpisodes(c.episodes || d.streamingEpisodes.length || 12);
      })
      .catch((e) => toast.error("Gagal memuat detail", { description: e.message }))
      .finally(() => setLoadingMeta(false));
  }, [id, nav]);

  // Load embed for current episode
  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    (async () => {
      setLoadingEmbed(true);
      setEmbed(null);
      setHits([]);
      try {
        const query = `${card.title} episode ${epNum}`;
        const { data, error } = await supabase.functions.invoke("scrape-anime", {
          body: { mode: "search", query, sources: SOURCES },
        });
        if (error) throw error;
        const results = data?.results || [];
        if (cancelled) return;
        setHits(results);
        if (!results.length) {
          toast.error("Tidak ada hasil", { description: "Coba episode atau judul lain." });
          setLoadingEmbed(false);
          return;
        }
        await openHit(results[0].url, true);
      } catch (e) {
        if (!cancelled) {
          toast.error("Gagal memuat episode", {
            description: e instanceof Error ? e.message : "Error",
          });
          setLoadingEmbed(false);
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, epNum]);

  const openHit = async (url: string, auto = false) => {
    if (!card) return;
    setLoadingEmbed(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-anime", {
        body: { mode: "detail", url },
      });
      if (error) throw error;
      const embedUrl = data?.embedUrls?.[0];
      if (!embedUrl) {
        toast.error("Embed tidak ditemukan", { description: "Coba sumber lain." });
        return;
      }
      setEmbed(embedUrl);
      setPickerOpen(false);
      if (user) {
        await saveProgress(user.id, card, epNum, embedUrl);
        toast.success(`Progress tersimpan • EP ${epNum}`, {
          description: `${card.title} disimpan ke akunmu.`,
        });
      } else if (!auto) {
        toast.message("Login untuk simpan progress", {
          description: "Masuk agar episode tersinkron ke akunmu.",
          action: { label: "Login", onClick: () => nav("/auth") },
        });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error("Gagal memutar", {
        description: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setLoadingEmbed(false);
    }
  };

  const goEp = (n: number) => {
    if (!card) return;
    if (n < 1 || n > totalEpisodes) return;
    nav(`/watch/${card.id}/${n}`);
  };

  if (loadingMeta || !card) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={(q) => nav(`/?q=${encodeURIComponent(q)}`)} />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 mt-5 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link to={`/anime/${card.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali ke detail
          </Link>
          {hits.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="rounded-xl">
              Ganti sumber ({hits.length})
            </Button>
          )}
        </div>

        <header className="space-y-1">
          <p className="text-xs text-primary mono tracking-widest">EPISODE {epNum} / {totalEpisodes}</p>
          <h1 className="display text-2xl sm:text-4xl font-black leading-tight">{card.title}</h1>
        </header>

        {/* PLAYER */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border glow-cyan grid place-items-center">
          {loadingEmbed || !embed ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <iframe
              src={embed}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              title={`${card.title} EP ${epNum}`}
            />
          )}
        </div>

        {/* PREV/NEXT */}
        <div className="flex items-center justify-between gap-2">
          <Button onClick={() => goEp(epNum - 1)} disabled={epNum <= 1} variant="outline" className="rounded-xl">
            <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
          </Button>
          <p className="text-xs text-muted-foreground">{params.get("from") === "detail" ? "" : ""}</p>
          <Button onClick={() => goEp(epNum + 1)} disabled={epNum >= totalEpisodes} className="rounded-xl bg-primary text-primary-foreground font-bold">
            Berikutnya <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* EPISODE LIST */}
        <section>
          <h2 className="display text-xl font-black mb-3 flex items-center gap-3">
            <span className="h-5 w-1.5 rounded-full bg-primary" /> Daftar Episode
          </h2>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {Array.from({ length: totalEpisodes }).map((_, i) => {
              const n = i + 1;
              const active = n === epNum;
              return (
                <button
                  key={n}
                  onClick={() => goEp(n)}
                  className={`aspect-square rounded-xl font-black text-sm border transition ${
                    active
                      ? "bg-primary text-primary-foreground border-primary glow-cyan"
                      : "bg-secondary border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 grid place-items-center" onClick={() => setPickerOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="display text-2xl font-black">Pilih Sumber EP {epNum}</h3>
              <button onClick={() => setPickerOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hits.map((h) => (
                <button key={h.url} onClick={() => openHit(h.url)} className="text-left bg-secondary/50 border border-border rounded-xl p-3 hover:border-primary transition">
                  <p className="font-bold text-sm leading-tight">{h.title}</p>
                  <p className="text-[10px] text-primary font-bold mt-1 tracking-wider">{h.source.toUpperCase()}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
