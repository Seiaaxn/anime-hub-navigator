import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, Play, Trash2, History as HistoryIcon, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getProgressList, countProgress } from "@/lib/progress";
import { SiteHeader } from "@/components/SiteHeader";

const PAGE_SIZE = 50;

type ProgressRow = {
  anime_id: string;
  title: string;
  cover: string | null;
  episode: number;
  embed_url: string | null;
  updated_at: string;
};

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<ProgressRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const [data, count] = await Promise.all([
      getProgressList(user.id, PAGE_SIZE, 0),
      countProgress(user.id),
    ]);
    setItems((data as ProgressRow[]) || []);
    setTotal(count);
    setLoading(false);
  };

  const loadMore = async () => {
    if (!user || loadingMore) return;
    setLoadingMore(true);
    const data = await getProgressList(user.id, PAGE_SIZE, items.length);
    setItems((prev) => [...prev, ...((data as ProgressRow[]) || [])]);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const remove = async (animeId: string, title: string) => {
    const tId = toast.loading("Menghapus dari riwayat…");
    const { error } = await supabase
      .from("watch_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("anime_id", animeId);
    if (error) {
      toast.error("Gagal menghapus riwayat", { id: tId, description: error.message });
    } else {
      toast.success("Riwayat dihapus", { id: tId, description: `${title} dihapus dari daftar tonton.` });
      setItems((prev) => prev.filter((p) => p.anime_id !== animeId));
      setTotal((t) => Math.max(0, t - 1));
    }
  };

  const clearAll = async () => {
    if (!items.length) return;
    const tId = toast.loading("Mengosongkan riwayat…");
    const { error } = await supabase.from("watch_progress").delete().eq("user_id", user.id);
    if (error) {
      toast.error("Gagal mengosongkan riwayat", { id: tId, description: error.message });
    } else {
      toast.success("Riwayat dikosongkan", { id: tId, description: `${total} item berhasil dihapus.` });
      setItems([]);
      setTotal(0);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={(q) => nav(`/?q=${encodeURIComponent(q)}`)} />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 mt-6 space-y-6">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="display text-3xl sm:text-4xl font-black flex items-center gap-3">
              <span className="h-7 w-1.5 rounded-full bg-primary" /> Riwayat Tonton
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Lanjutkan dari episode terakhir yang kamu tonton.</p>
          </div>
          {items.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Kosongkan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kosongkan riwayat tonton?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Semua {total} item riwayat akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Ya, kosongkan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </header>

        {loading ? (
          <div className="py-20 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-card-grad rounded-2xl">
            <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada riwayat tonton.</p>
            <Link to="/" className="inline-block mt-3 text-primary font-bold hover:underline">Mulai menonton →</Link>
          </div>
        ) : (
          <>
          <p className="text-xs text-muted-foreground mono">Menampilkan {items.length} dari {total} riwayat • diurutkan terbaru</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((p) => {
              const assumedTotal = 12;
              const pct = Math.min(100, Math.round((p.episode / assumedTotal) * 100));
              return (
                <li key={p.anime_id} className="group bg-card-grad rounded-2xl border border-border hover:border-primary transition overflow-hidden">
                  <div className="flex gap-3 p-3">
                    <Link to={`/anime/${p.anime_id}`} className="shrink-0">
                      <div className="h-24 w-16 rounded-lg overflow-hidden bg-secondary border border-border">
                        {p.cover ? (
                          <img src={p.cover} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-muted-foreground text-xs">No Cover</div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link to={`/anime/${p.anime_id}`} className="font-bold text-sm leading-tight line-clamp-2 hover:text-primary">
                        {p.title}
                      </Link>
                      <p className="text-[11px] text-muted-foreground mono mt-1">EP {p.episode} • {timeAgo(p.updated_at)}</p>

                      <div className="mt-auto pt-3 space-y-2">
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-primary glow-cyan" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => nav(`/watch/${p.anime_id}/${p.episode}`)}
                            className="h-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex-1"
                          >
                            <Play className="h-3 w-3 mr-1 fill-current" /> Lanjutkan EP {p.episode}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(p.anime_id, p.title)}
                            className="h-8 w-8 hover:bg-destructive/15 hover:text-destructive"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {items.length < total && (
            <div className="flex justify-center pt-2">
              <Button onClick={loadMore} disabled={loadingMore} variant="outline" className="rounded-xl px-6">
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                Muat lebih banyak ({total - items.length} tersisa)
              </Button>
            </div>
          )}
          </>
        )}
      </main>
    </div>
  );
};

export default History;
