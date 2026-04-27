import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Compass, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchGenres, type SankaGenre } from "@/lib/sankavollerei";
import { GENRES as FALLBACK_GENRES } from "@/data/anime";

const Genres = () => {
  const nav = useNavigate();
  const [genres, setGenres] = useState<SankaGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchGenres(ctrl.signal)
      .then(setGenres)
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(e.message || "Gagal memuat");
          // graceful fallback list so page still useful
          setGenres(FALLBACK_GENRES.map((g) => ({ title: g, genreId: g.toLowerCase().replace(/\s+/g, "-") })));
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={(q) => nav(`/?q=${encodeURIComponent(q)}`)} />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 mt-6 space-y-6">
        <header>
          <h1 className="display text-3xl sm:text-4xl font-black flex items-center gap-3">
            <span className="h-7 w-1.5 rounded-full bg-primary" /> Semua Genre
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Compass className="h-3.5 w-3.5" /> Pilih genre untuk menjelajah daftar anime.
          </p>
        </header>

        {loading ? (
          <div className="py-20 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {error && (
              <div className="bg-card-grad border border-border rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                Sumber utama tidak tersedia, menampilkan daftar cadangan.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <Link
                  key={g.genreId}
                  to={`/genre/${g.genreId}`}
                  className="text-xs sm:text-sm px-4 py-2 rounded-full bg-secondary border border-border text-muted-foreground hover:text-primary hover:border-primary transition"
                >
                  {g.title}
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Genres;
