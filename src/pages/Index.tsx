import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Languages, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Spotlight } from "@/components/Spotlight";
import { SplashLoader } from "@/components/SplashLoader";
import { PortraitGrid, RowList, SectionTitle } from "@/components/AnimeBlocks";
import { GENRES, type AnimeCard } from "@/data/anime";
import { fetchHomeData, fetchSchedule, searchAniList, type ScheduleItem } from "@/lib/anilist";

const SOURCES = [
  "otakudesu.cloud", "samehadaku.email", "anoboy.cyou", "kuramanime.boo",
  "anitaku.bz", "otaku.blog", "gogoanime.by", "gogoanime3.co", "gogoanime.tel",
  "alqanime.net", "nimegami.id", "neonime.lat", "anikyojin.net", "oploverz.cyou",
];

type SearchHit = { title: string; url: string; source: string; snippet?: string };

const Index = () => {
  const nav = useNavigate();
  // Splash
  const [splash, setSplash] = useState(true);

  // AniList data
  const [loadingData, setLoadingData] = useState(true);
  const [spotlight, setSpotlight] = useState<AnimeCard[]>([]);
  const [trending, setTrending] = useState<AnimeCard[]>([]);
  const [topAiring, setTopAiring] = useState<AnimeCard[]>([]);
  const [popular, setPopular] = useState<AnimeCard[]>([]);
  const [favorites, setFavorites] = useState<AnimeCard[]>([]);
  const [completed, setCompleted] = useState<AnimeCard[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  // Search / streaming state
  const [searching, setSearching] = useState(false);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeEmbed, setActiveEmbed] = useState<string | null>(null);
  const [loadingEmbed, setLoadingEmbed] = useState(false);

  const [subUrl, setSubUrl] = useState("");
  const [targetLang, setTargetLang] = useState<"id" | "en" | "ja">("id");
  const [translating, setTranslating] = useState(false);
  const [translatedVttUrl, setTranslatedVttUrl] = useState<string | null>(null);

  // Fetch AniList on mount
  useEffect(() => {
    (async () => {
      try {
        const [home, sched] = await Promise.all([fetchHomeData(), fetchSchedule()]);
        setSpotlight(home.spotlight);
        setTrending(home.trending);
        setTopAiring(home.topAiring);
        setPopular(home.popular);
        setFavorites(home.favorites);
        setCompleted(home.completed);
        setSchedule(sched);
      } catch (err) {
        toast({ title: "Gagal memuat data anime", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  const handleSearch = async (q: string) => {
    setSearching(true); setSearchHits([]); setSearchOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-anime", {
        body: { mode: "search", query: q, sources: SOURCES },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSearchHits(data.results || []);
      if (!data.results?.length) toast({ title: "Tidak ada hasil." });
    } catch (err: unknown) {
      toast({ title: "Gagal mencari", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const watchAnime = (a: AnimeCard) => {
    nav(`/anime/${a.id}`);
  };

  const openHit = async (url: string) => {
    setLoadingEmbed(true); setActiveEmbed(null);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-anime", { body: { mode: "detail", url } });
      if (error) throw error;
      if (data?.embedUrls?.length) {
        setActiveEmbed(data.embedUrls[0]);
        setSearchOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast({ title: "Embed tidak ditemukan", description: "Coba sumber lain.", variant: "destructive" });
      }
    } catch (err: unknown) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setLoadingEmbed(false);
    }
  };

  const handleTranslate = async () => {
    if (!subUrl) { toast({ title: "URL subtitle kosong" }); return; }
    setTranslating(true); setTranslatedVttUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("translate-subtitle", { body: { sourceUrl: subUrl, targetLang } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const blob = new Blob([data.vtt], { type: "text/vtt" });
      setTranslatedVttUrl(URL.createObjectURL(blob));
      toast({ title: "Subtitle siap", description: targetLang.toUpperCase() });
    } catch (err: unknown) {
      toast({ title: "Gagal terjemahkan", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally { setTranslating(false); }
  };

  if (splash) return <SplashLoader onDone={() => setSplash(false)} />;

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={handleSearch} />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 mt-5 space-y-10">
        {(loadingEmbed || activeEmbed) && (
          <section className="space-y-3">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border glow-cyan grid place-items-center">
              {loadingEmbed ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> :
                <iframe src={activeEmbed!} className="w-full h-full" allow="autoplay; encrypted-media; fullscreen" allowFullScreen referrerPolicy="no-referrer" />}
            </div>
            <Card className="bg-card-grad border-0 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary" />
                <h3 className="font-extrabold">Subtitle Multi-Bahasa (AI)</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={subUrl} onChange={(e) => setSubUrl(e.target.value)} placeholder="https://…/subtitle.vtt"
                  className="flex-1 h-11 rounded-xl bg-input border-border" />
                <Select value={targetLang} onValueChange={(v) => setTargetLang(v as "id" | "en" | "ja")}>
                  <SelectTrigger className="w-full sm:w-32 h-11 rounded-xl bg-input border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Indonesia</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleTranslate} disabled={translating}
                  className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                  {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Translate"}
                </Button>
              </div>
              {translatedVttUrl && (
                <a href={translatedVttUrl} download={`subtitle.${targetLang}.vtt`} className="text-xs text-primary underline">
                  ⬇ Unduh subtitle.{targetLang}.vtt
                </a>
              )}
            </Card>
          </section>
        )}

        {loadingData ? (
          <div className="py-32 grid place-items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Spotlight items={spotlight} onWatch={watchAnime} />

            <section>
              <SectionTitle title="Trending" />
              <PortraitGrid items={trending} onClick={watchAnime} withRank />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Top Airing", items: topAiring },
                { title: "Most Popular", items: popular },
                { title: "Most Favorite", items: favorites },
                { title: "Latest Completed", items: completed },
              ].map((b) => (
                <div key={b.title} className="bg-card-grad rounded-2xl p-4">
                  <SectionTitle title={b.title} viewMoreHref="/genres" />
                  <RowList items={b.items} onClick={watchAnime} />
                </div>
              ))}
            </section>

            <section id="most-popular">
              <SectionTitle title="Latest Episode" viewMoreHref="/genres" />
              <PortraitGrid items={trending} onClick={watchAnime} />
            </section>

            <section className="bg-card-grad rounded-2xl p-5 sm:p-7">
              <SectionTitle title="Estimated Schedule" />
              <p className="text-xs text-muted-foreground mb-3 mono">Jadwal tayang 24 jam ke depan</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
                {Array.from({ length: 14 }).map((_, i) => {
                  const d = new Date(); d.setDate(d.getDate() + i - 6);
                  const isToday = i === 6;
                  return (
                    <button key={i} className={`shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center border transition
                      ${isToday ? "bg-primary text-primary-foreground border-primary glow-cyan" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
                      <span className="text-[10px] uppercase">{d.toLocaleString("en", { month: "short" })}</span>
                      <span className="text-lg font-black">{d.getDate()}</span>
                      <span className="text-[9px]">{d.toLocaleString("en", { weekday: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {schedule.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60 border border-border hover:border-primary transition">
                    <img src={s.cover} alt={s.title} loading="lazy" className="h-10 w-8 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground mono">{s.time} • Ep {s.ep}</p>
                    </div>
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <SectionTitle title="Genres" viewMoreHref="/genres" />
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => {
                  const slug = g.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <button
                      key={g}
                      onClick={() => nav(`/genre/${slug}`)}
                      className="text-xs sm:text-sm px-4 py-2 rounded-full bg-secondary border border-border text-muted-foreground hover:text-primary hover:border-primary transition"
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-card-grad rounded-2xl p-5 sm:p-7">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="display text-2xl sm:text-3xl font-black flex items-center gap-3">
                  <span className="h-7 w-1.5 rounded-full bg-primary" /> Top 10
                </h3>
                <div className="flex gap-1 bg-secondary rounded-full p-1 text-xs">
                  {["today", "week", "month"].map((t, i) => (
                    <button key={t} className={`px-3 py-1 rounded-full font-bold capitalize ${i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {trending.slice(0, 10).map((a, i) => (
                  <li key={a.id}>
                    <button onClick={() => watchAnime(a)} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-secondary transition group">
                      <span className={`display text-3xl font-black w-10 text-center ${i < 3 ? "text-primary" : "text-muted-foreground/40"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <img src={a.cover} alt={a.title} loading="lazy" className="h-14 w-10 rounded object-cover border border-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary">{a.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.type} • EP {a.episodes}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <footer className="pt-6 border-t border-border space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
            <a href="/tos" onClick={(e) => { e.preventDefault(); nav("/tos"); }} className="hover:text-primary">TOS</a>
            <span>·</span>
            <a href="/dmca" onClick={(e) => { e.preventDefault(); nav("/dmca"); }} className="hover:text-primary">DMCA</a>
            <span>·</span>
            <a href="/genres" onClick={(e) => { e.preventDefault(); nav("/genres"); }} className="hover:text-primary">Semua Genre</a>
            <span>·</span>
            <a href="https://discord.com/invite/ZYP9Ks6SmH" target="_blank" rel="noreferrer" className="hover:text-primary">Discord</a>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">© 2026 NexaPlay — data oleh AniList.</p>
        </footer>
      </main>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 sm:p-10 overflow-y-auto" onClick={() => setSearchOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="display text-2xl font-black">Hasil Pencarian</h3>
              <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {searching && <div className="py-12 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {!searching && !searchHits.length && (
              <p className="text-center py-8 text-muted-foreground text-sm">Tidak ada hasil.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchHits.map((h) => (
                <button key={h.url} onClick={() => openHit(h.url)}
                  className="text-left bg-secondary/50 border border-border rounded-xl p-4 hover:border-primary hover:glow-cyan transition">
                  <p className="font-bold leading-tight">{h.title}</p>
                  <p className="text-[10px] text-primary font-bold mt-1 tracking-wider">{h.source.toUpperCase()}</p>
                  {h.snippet && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{h.snippet}</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Suppress unused import warning — searchAniList exported for future use
void searchAniList;

export default Index;
