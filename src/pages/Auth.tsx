import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import mascot from "@/assets/nexa-mascot.png";

const Auth = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { username: username || email.split("@")[0] } },
        });
        if (error) throw error;
        toast({ title: "Akun dibuat!", description: "Selamat datang di NexaPlay." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav("/");
    } catch (err) {
      toast({ title: "Gagal", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[hsl(var(--neon-pink))]/20 blur-3xl" />
      <Card className="relative w-full max-w-md bg-card-grad border-0 rounded-3xl p-8 space-y-5">
        <div className="flex flex-col items-center gap-3">
          <img src={mascot} alt="" width={96} height={96} className="h-24 w-24 drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]" />
          <h1 className="display text-3xl font-black tracking-tight">
            <span className="text-gradient-neon">NEXA</span>PLAY
          </h1>
          <p className="text-xs text-muted-foreground">{mode === "login" ? "Masuk untuk lanjut menonton" : "Buat akun gratis"}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="h-11 rounded-xl bg-input border-border" />
          )}
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-11 rounded-xl bg-input border-border" />
          <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6)" className="h-11 rounded-xl bg-input border-border" />
          <Button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold glow-cyan">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "MASUK" : "DAFTAR"}
          </Button>
        </form>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-xs text-muted-foreground hover:text-primary">
          {mode === "login" ? "Belum punya akun? Daftar di sini" : "Sudah punya akun? Masuk"}
        </button>
      </Card>
    </div>
  );
};

export default Auth;
