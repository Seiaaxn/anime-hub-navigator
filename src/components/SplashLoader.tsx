import { useEffect, useState } from "react";
import mascot from "@/assets/nexa-mascot.png";

const TAGLINES = [
  "Memuat semesta anime...",
  "Menyalakan layar bioskop...",
  "Mengundang waifu favoritmu...",
  "Menyiapkan subtitle ajaib...",
];

export const SplashLoader = ({ onDone }: { onDone: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [tagIdx, setTagIdx] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 9 + 3;
        if (next >= 100) {
          clearInterval(tick);
          setTimeout(onDone, 400);
          return 100;
        }
        return next;
      });
    }, 110);
    const tag = setInterval(() => setTagIdx((i) => (i + 1) % TAGLINES.length), 900);
    return () => { clearInterval(tick); clearInterval(tag); };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] bg-background grid place-items-center overflow-hidden">
      {/* animated neon orbs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[hsl(var(--neon-pink))]/20 blur-3xl animate-pulse" style={{ animationDelay: "0.6s" }} />
      <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-[hsl(var(--neon-purple))]/15 blur-3xl animate-pulse" style={{ animationDelay: "1.2s" }} />

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        {/* mascot with float + glow ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
          <div className="relative animate-[float_2.5s_ease-in-out_infinite]">
            <img src={mascot} alt="NexaPlay mascot" width={180} height={180}
              className="h-44 w-44 sm:h-56 sm:w-56 drop-shadow-[0_0_30px_hsl(var(--primary)/0.6)]" />
          </div>
          {/* spinning ring */}
          <div className="absolute inset-0 -m-4 rounded-full border-2 border-transparent border-t-primary border-r-[hsl(var(--neon-pink))] animate-spin" style={{ animationDuration: "1.8s" }} />
        </div>

        {/* brand */}
        <div>
          <h1 className="display text-5xl sm:text-7xl font-black tracking-tight">
            <span className="text-gradient-neon">NEXA</span>
            <span className="text-foreground">PLAY</span>
          </h1>
          <p className="text-xs mono text-muted-foreground tracking-[0.3em] mt-1">STREAM · BEYOND · LIMITS</p>
        </div>

        {/* progress */}
        <div className="w-64 sm:w-80 space-y-2">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--neon-pink)), hsl(var(--neon-purple)))",
                boxShadow: "0 0 12px hsl(var(--primary) / 0.8)",
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] mono text-muted-foreground">
            <span key={tagIdx} className="animate-fade-in">{TAGLINES[tagIdx]}</span>
            <span className="text-primary">{Math.floor(progress)}%</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
};
