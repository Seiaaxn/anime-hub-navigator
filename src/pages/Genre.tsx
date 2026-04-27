import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { fetchGenreAnime, type SankaAnime } from "@/lib/sankavollerei";

const Genre = () => {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const [items, setItems] = useState<SankaAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchGenreAnime(slug, ctrl.signal)
      .then((list) => setItems(list))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Gagal memuat");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [slug]);

  const pretty = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={(q) => nav(`/?q=${encodeURIComponent(q)}`)} />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 mt-6 space-y-6">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <Link to="/genres" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-2">
              <ArrowLeft className="h-3 w-3 mr-1" /> Semua Genre
            </Link>
            <h1 className="display text-3xl sm:text-4xl font-black flex items-center gap-3">
              <span className="h-7 w-1.5 rounded-full bg-primary" /> Genre: {pretty}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Daftar anime bergenre {pretty}.</p>
          </div>
        </header>

        {loading ? (
          <div className="py-20 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="py-16 text-center bg-card-grad rounded-2xl">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Gagal memuat genre: {error}</p>
            <Button onClick={() => nav("/")} variant="outline" className="mt-4 rounded-xl">Kembali ke Home</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-card-grad rounded-2xl">
            <p className="text-muted-foreground">Belum ada anime untuk genre ini.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((a) => (
              <li key={a.animeId}>
                <Link
                  to={`/?q=${encodeURIComponent(a.title)}`}
                  className="group block bg-card-grad rounded-xl border border-border hover:border-primary transition overflow-hidden"
                >
                  <div className="aspect-[2/3] bg-secondary overflow-hidden">
                    <img src={a.poster} alt={a.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-bold line-clamp-2 group-hover:text-primary">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 mono">
                      {a.type || "TV"}{a.score ? ` • ★ ${a.score}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Genre;
