import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, Save, User, Mail, Calendar, Heart, History as HistoryIcon, LogOut, Upload, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { getProgressList } from "@/lib/progress";
import { SiteHeader } from "@/components/SiteHeader";

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const nav = useNavigate();
  const { favorites } = useFavorites();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) toast.error("Gagal memuat profil", { description: error.message });
      if (data) {
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url || "");
        setCreatedAt(data.created_at);
      }
      const hist = await getProgressList(user.id);
      setHistoryCount(hist.length);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const save = async () => {
    if (!username.trim()) {
      toast.error("Username wajib diisi");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim(), avatar_url: avatarUrl.trim() || null })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan", { description: error.message });
    } else {
      toast.success("Profil tersimpan", { description: "Perubahanmu sudah aktif." });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran maksimal 5MB");
      return;
    }
    setUploading(true);
    const tId = toast.loading("Mengunggah avatar…");
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600", upsert: true,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      if (dbErr) throw dbErr;
      setAvatarUrl(url);
      toast.success("Avatar diperbarui", { id: tId, description: "Foto profil baru sudah aktif." });
    } catch (err: any) {
      toast.error("Gagal mengunggah avatar", { id: tId, description: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const doSignOut = async () => {
    await signOut();
    toast.success("Berhasil keluar", { description: "Sampai jumpa lagi!" });
    nav("/");
  };

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  const initials = (username || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader onSearch={(q) => nav(`/?q=${encodeURIComponent(q)}`)} />

      <main className="max-w-4xl mx-auto px-3 sm:px-5 mt-6 space-y-6">
        <header>
          <h1 className="display text-3xl sm:text-4xl font-black flex items-center gap-3">
            <span className="h-7 w-1.5 rounded-full bg-primary" /> Pengaturan Profil
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Atur identitas dan lihat status akunmu.</p>
        </header>

        {loading ? (
          <div className="py-16 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* IDENTITAS */}
            <Card className="bg-card-grad border-0 rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-primary glow-cyan">
                    <AvatarImage src={avatarUrl} alt={username} />
                    <AvatarFallback className="bg-secondary text-primary font-black text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    aria-label="Ganti avatar"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center border-2 border-background hover:scale-105 transition disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div className="min-w-0">
                  <p className="display text-xl font-black truncate">{username || user.email?.split("@")[0]}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {user.email}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Klik ikon unggah untuk ganti foto (maks 5MB)</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground">Username</Label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nama panggilanmu"
                      className="pl-9 h-11 rounded-xl bg-input border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="avatar" className="text-xs uppercase tracking-widest text-muted-foreground">URL Avatar</Label>
                  <Input
                    id="avatar"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://…/avatar.png"
                    className="h-11 rounded-xl bg-input border-border"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={save} disabled={saving} className="h-11 rounded-xl bg-primary text-primary-foreground font-extrabold glow-cyan">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Simpan Perubahan</>}
                </Button>
              </div>
            </Card>

            {/* STATUS AKUN */}
            <Card className="bg-card-grad border-0 rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="display text-xl font-black flex items-center gap-2">
                <span className="h-5 w-1.5 rounded-full bg-primary" /> Status Akun
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat icon={<Calendar className="h-4 w-4" />} label="Bergabung" value={memberSince} />
                <Stat
                  icon={<span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--neon-cyan,200_100%_50%))] bg-primary" />}
                  label="Status"
                  value={user.email_confirmed_at ? "Aktif" : "Belum verifikasi"}
                />
                <Stat icon={<Heart className="h-4 w-4 text-[hsl(var(--neon-pink))]" />} label="Favorit" value={`${favorites.length}`} />
                <Stat icon={<HistoryIcon className="h-4 w-4 text-primary" />} label="Riwayat" value={`${historyCount}`} />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => nav("/my-list")} variant="outline" className="rounded-xl">
                  <Heart className="h-4 w-4 mr-2 text-[hsl(var(--neon-pink))]" /> My List
                </Button>
                <Button onClick={() => nav("/history")} variant="outline" className="rounded-xl">
                  <HistoryIcon className="h-4 w-4 mr-2" /> Riwayat
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-xl ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Keluar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Kamu akan logout dari Nexa. Riwayat dan favoritmu tetap tersimpan dan bisa diakses kembali setelah login.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={doSignOut}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Ya, keluar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-secondary/50 border border-border rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-widest">
      {icon} {label}
    </div>
    <p className="font-bold text-sm mt-1 truncate">{value}</p>
  </div>
);

export default Profile;
