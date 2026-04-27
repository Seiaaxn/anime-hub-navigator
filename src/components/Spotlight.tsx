import { useState } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Subtitles, Tv } from "lucide-react";
import type { AnimeCard } from "@/data/anime";
import { Badge } from "@/components/ui/badge";

export const Spotlight = ({ items, onWatch }: { items: AnimeCard[]; onWatch: (a: AnimeCard) => void }) => {
  const [idx, setIdx] = useState(0);
  const a = items[idx];
  const next = () => setIdx((idx + 1) % items.length);
  const prev = () => setIdx((idx - 1 + items.length) % items.length);

  return (
    <section id="home" className="relative rounded-3xl overflow-hidden border border-border bg-card min-h-[420px] sm:min-h-[480px]">
      {/* bg */}
      <div className="absolute inset-0">
        <img src={a.banner} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="relative p-6 sm:p-10 max-w-2xl space-y-4">
        <p className="text-primary font-extrabold text-sm">#{idx + 1} Spotlight</p>
        <h2 className="display text-3xl sm:text-5xl font-black leading-tight">{a.title}</h2>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Tv className="h-3.5 w-3.5" /> {a.type}</span>
          <span className="flex items-center gap-1.5"><Play className="h-3 w-3 fill-current" /> {a.episodes} Eps</span>
          <span>📅 {a.year}</span>
          <Badge className="bg-primary text-primary-foreground rounded font-bold">{a.rating}</Badge>
          {a.sub != null && <Badge className="bg-emerald-500 text-black rounded font-bold flex gap-1"><Subtitles className="h-3 w-3" />{a.sub}</Badge>}
        </div>

        <p className="text-sm text-muted-foreground/90 line-clamp-3 max-w-lg">{a.synopsis}</p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button onClick={() => onWatch(a)}
            className="h-11 px-5 rounded-full bg-primary text-primary-foreground font-extrabold text-sm flex items-center gap-2 glow-cyan hover:scale-[1.02] transition">
            <Play className="h-4 w-4 fill-current" /> Watch Now
          </button>
          <button className="h-11 px-5 rounded-full bg-secondary text-foreground font-extrabold text-sm flex items-center gap-2 hover:bg-secondary/80 transition border border-border">
            Detail <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* controls */}
      <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button onClick={prev} className="h-10 w-10 rounded-full bg-card/80 backdrop-blur border border-border grid place-items-center hover:text-primary"><ChevronLeft className="h-5 w-5" /></button>
        <button onClick={next} className="h-10 w-10 rounded-full bg-card/80 backdrop-blur border border-border grid place-items-center hover:text-primary"><ChevronRight className="h-5 w-5" /></button>
      </div>

      {/* dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {items.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40"}`} />
        ))}
      </div>
    </section>
  );
};
