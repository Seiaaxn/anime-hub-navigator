import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, Shuffle, Film, Star, MessageCircle, X, Compass, Heart, LogOut, User, History as HistoryIcon, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GENRES } from "@/data/anime";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ROUTES = [
  { label: "Home Base", to: "/" },
  { label: "My List", to: "/my-list", auth: true },
  { label: "Riwayat Tonton", to: "/history", auth: true },
  { label: "Profil Saya", to: "/profile", auth: true },
];

export const SiteHeader = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<"EN" | "JP">("EN");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const askLogout = () => {
    setOpen(false);
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    await signOut();
    toast.success("Berhasil keluar", { description: "Sampai jumpa lagi!" });
    setLogoutOpen(false);
    nav("/");
  };

  const goAuthOrPage = (to: string, requiresAuth: boolean) => {
    setOpen(false);
    if (requiresAuth && !user) {
      toast.message("Login diperlukan", {
        description: "Masuk untuk akses fitur ini.",
        action: { label: "Login", onClick: () => nav("/auth") },
      });
      return;
    }
    nav(to);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setOpen(true)}
            className="p-2 -ml-1 text-foreground hover:text-primary transition"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/" className="display font-black text-lg sm:text-2xl tracking-tight whitespace-nowrap">
            <span className="text-gradient-neon">NEXA</span>
            <span>PLAY</span>
          </Link>

          <form
            onSubmit={(e) => { e.preventDefault(); if (q.trim()) onSearch(q); }}
            className="hidden md:flex flex-1 max-w-md mx-4 items-center bg-input rounded-full border border-border focus-within:border-primary transition"
          >
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Mau nonton apa hari ini?..."
              className="bg-transparent border-0 focus-visible:ring-0 h-10 text-sm"
            />
            <button type="submit" className="px-4 text-muted-foreground hover:text-primary">
              <Search className="h-4 w-4" />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => goAuthOrPage("/my-list", true)}
              className="hidden sm:flex flex-col items-center px-2 py-1 rounded-lg hover:bg-secondary transition text-[hsl(var(--neon-pink))]"
            >
              <Heart className="h-4 w-4 fill-current" />
              <span className="text-[9px] mt-0.5 text-muted-foreground">My List</span>
            </button>
            <button
              onClick={() => goAuthOrPage("/history", true)}
              className="hidden sm:flex flex-col items-center px-2 py-1 rounded-lg hover:bg-secondary transition text-primary"
            >
              <HistoryIcon className="h-4 w-4" />
              <span className="text-[9px] mt-0.5 text-muted-foreground">Riwayat</span>
            </button>

            <div className="hidden sm:flex flex-col items-center px-2">
              <div className="flex bg-secondary rounded-md overflow-hidden text-[10px] font-bold">
                <button onClick={() => setLang("EN")} className={cn("px-2 py-0.5", lang === "EN" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>EN</button>
                <button onClick={() => setLang("JP")} className={cn("px-2 py-0.5", lang === "JP" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>JP</button>
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5">Title Lang</span>
            </div>

            {user ? (
              <>
                <Button onClick={() => nav("/my-list")} variant="ghost" size="icon" className="sm:hidden h-9 w-9" aria-label="My List">
                  <Heart className="h-4 w-4 text-[hsl(var(--neon-pink))]" />
                </Button>
                <button
                  onClick={() => nav("/profile")}
                  className="hidden sm:flex items-center gap-2 ml-1 px-3 h-9 rounded-xl bg-secondary border border-border hover:border-primary transition"
                  title="Pengaturan profil"
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold truncate max-w-[100px]">{user.email?.split("@")[0]}</span>
                </button>
                <Button onClick={() => nav("/profile")} variant="ghost" size="icon" className="sm:hidden h-9 w-9" aria-label="Profil">
                  <User className="h-4 w-4 text-primary" />
                </Button>
                <Button onClick={askLogout} variant="ghost" size="icon" className="h-9 w-9" title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => nav("/auth")} className="ml-1 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm px-4 hover:bg-primary/90 glow-cyan">
                LOGIN
              </Button>
            )}
          </div>
        </div>

        {/* mobile search */}
        <div className="md:hidden px-3 pb-3">
          <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) onSearch(q); }}
            className="flex items-center bg-input rounded-full border border-border">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mau nonton apa hari ini?..."
              className="bg-transparent border-0 focus-visible:ring-0 h-10 text-sm" />
            <button type="submit" className="px-4 text-muted-foreground"><Search className="h-4 w-4" /></button>
          </form>
        </div>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative w-80 max-w-[85vw] h-full bg-card border-r border-border overflow-y-auto"
          >
            <div className="p-5 space-y-6">
              <div className="flex items-start justify-between">
                <button
                  onClick={() => { setOpen(false); nav(user ? "/profile" : "/auth"); }}
                  className="flex items-center gap-3 text-left"
                >
                  <div className="h-12 w-12 rounded-full bg-secondary grid place-items-center text-primary font-black text-xl">
                    {user ? (user.email?.[0] || "U").toUpperCase() : "G"}
                  </div>
                  <div>
                    <p className="font-bold">{user ? user.email?.split("@")[0] : "Guest User"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user ? "Lihat profilmu" : "Login untuk akses fitur kelas Yonko!"}
                    </p>
                  </div>
                </button>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>

              {user ? (
                <Button
                  onClick={() => { setOpen(false); nav("/profile"); }}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-extrabold glow-cyan"
                >
                  <Settings className="h-4 w-4 mr-2" /> PENGATURAN PROFIL
                </Button>
              ) : (
                <Button
                  onClick={() => { setOpen(false); nav("/auth"); }}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-extrabold glow-cyan"
                >
                  LOGIN SEKARANG
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setOpen(false); nav("/"); }}
                  className="rounded-xl bg-secondary px-4 py-3 flex items-center gap-2 text-sm font-semibold hover:text-primary"
                >
                  <Shuffle className="h-4 w-4" /> Telusuri
                </button>
                <button
                  onClick={() => goAuthOrPage("/history", true)}
                  className="rounded-xl bg-secondary px-4 py-3 flex items-center gap-2 text-sm font-semibold hover:text-primary"
                >
                  <Film className="h-4 w-4" /> Riwayat
                </button>
              </div>

              <div>
                <h4 className="text-primary font-extrabold text-xs tracking-widest mb-3 flex items-center gap-2">
                  <Compass className="h-4 w-4" /> PETA GENRE
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.slice(0, 10).map((g) => (
                    <button
                      key={g}
                      onClick={() => { setOpen(false); nav(`/?q=${encodeURIComponent(g)}`); }}
                      className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground hover:text-primary border border-border"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-primary font-extrabold text-xs tracking-widest mb-3">JALUR PELAYARAN</h4>
                <ul className="space-y-1">
                  {NAV_ROUTES.map((r) => (
                    <li key={r.label}>
                      <button
                        onClick={() => goAuthOrPage(r.to, !!r.auth)}
                        className="w-full text-left block px-3 py-2 rounded-lg text-sm hover:bg-secondary hover:text-primary"
                      >
                        {r.label}
                      </button>
                    </li>
                  ))}
                  {user && (
                    <li>
                      <button
                        onClick={askLogout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-secondary text-destructive"
                      >
                        <LogOut className="h-4 w-4" /> Keluar
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              <a href="https://discord.com/invite/ZYP9Ks6SmH" target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[hsl(var(--neon-purple))] text-white font-extrabold text-sm glow-purple">
                <MessageCircle className="h-4 w-4 fill-current" /> Join Nakama Discord
              </a>

              <p className="text-[10px] text-center text-muted-foreground pt-4">© 2026 NexaPlay</p>
            </div>
          </aside>
        </div>
      )}

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan logout dari Nexa. Riwayat tonton dan favoritmu tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
// Suppress unused-import warning for Star (kept for potential future use)
void Star;
