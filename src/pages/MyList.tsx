import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, Heart, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, type FavoriteRow } from "@/hooks/useFavorites";
import { getProgressList } from "@/lib/progress";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

type Progress = { anime_id: string; title: string; cover: string | null; episode: number; updated_at: string };

const MyList = () => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading, refresh } = useFavorites();
  const [progress, setProgress] = useState<Progress[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    if (user) getProgressList(user.id).then((d) => setProgress(d as Progress[]));
  }, [user]);

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const remove = async (animeId: string, title: string) => {
    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("anime_id", animeId);
    if (error) {
      toast.error("Gagal menghapus", { description: error.message });
    } else {
      toast.success("Dihapus dari My List", { description: title });
      refresh();
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={() => {}} />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 mt-6 space-y-10">

        {/* CONTINUE WATCHING */}
        {progress.length > 0 && (
          <section>
            <h2 className="display text-2xl sm:text-3xl font-black mb-4 flex items-center gap-3">
              <span className="h-7 w-1.5 rounded-full bg-primary" /> Lanjutkan Menonton
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {progress.map((p) => (
                <Link key={p.anime_id} to={`/anime/${p.anime_id}`} className="group bg-card-grad rounded-xl overflow-hidden border border-border hover:border-primary transition">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    {p.cover && <img src={p.cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent flex items-end p-2">
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <Play className="h-3 w-3 fill-primary text-primary" />
                        <span>EP {p.episode}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold p-2 truncate">{p.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAVORITES */}
        <section>
          <h2 className="display text-2xl sm:text-3xl font-black mb-4 flex items-center gap-3">
            <Heart className="h-6 w-6 text-[hsl(var(--neon-pink))] fill-current" /> My List
          </h2>

          {loading ? (
            <div className="py-16 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : favorites.length === 0 ? (
            <div className="py-16 text-center bg-card-grad rounded-2xl">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Daftar Anda kosong.</p>
              <Link to="/" className="inline-block mt-3 text-primary font-bold hover:underline">Telusuri anime →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {favorites.map((f: FavoriteRow) => (
                <div key={f.anime_id} className="group relative bg-card-grad rounded-xl overflow-hidden border border-border hover:border-primary transition">
                  <Link to={`/anime/${f.anime_id}`} className="block">
                    <div className="aspect-[3/4] overflow-hidden">
                      {f.cover && <img src={f.cover} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition" />}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold truncate">{f.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{f.type} • {f.year}</p>
                    </div>
                  </Link>
                  <Button size="icon" variant="ghost" onClick={() => remove(f.anime_id, f.title)}
                    className="absolute top-1.5 right-1.5 h-7 w-7 bg-black/60 hover:bg-destructive opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MyList;
