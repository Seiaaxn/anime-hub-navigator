import type { AnimeCard } from "@/data/anime";
import { Play, ChevronRight } from "lucide-react";

export const SectionTitle = ({ title, viewMoreHref }: { title: string; viewMoreHref?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="display text-2xl sm:text-3xl font-black flex items-center gap-3">
      <span className="h-7 w-1.5 rounded-full bg-primary" />
      {title}
    </h3>
    {viewMoreHref && (
      <a href={viewMoreHref} className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1 font-bold">
        View More <ChevronRight className="h-4 w-4" />
      </a>
    )}
  </div>
);

export const PortraitCard = ({ a, onClick, rank }: { a: AnimeCard; onClick: (a: AnimeCard) => void; rank?: number }) => (
  <button onClick={() => onClick(a)} className="group text-left relative">
    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary border border-border">
      <img src={a.cover} alt={a.title} loading="lazy"
        className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
      {rank != null && (
        <span className="absolute left-1 top-1 display text-3xl font-black text-foreground/80 [-webkit-text-stroke:1px_hsl(var(--primary))]">
          {rank}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
        <Play className="h-6 w-6 text-primary fill-current" />
      </div>
    </div>
    <p className="text-xs sm:text-sm font-semibold mt-2 line-clamp-2 group-hover:text-primary transition">{a.title}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{a.type} • {a.episodes} Eps</p>
  </button>
);

export const PortraitGrid = ({ items, onClick, withRank }: { items: AnimeCard[]; onClick: (a: AnimeCard) => void; withRank?: boolean }) => (
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
    {items.map((a, i) => <PortraitCard key={a.id} a={a} onClick={onClick} rank={withRank ? i + 1 : undefined} />)}
  </div>
);

export const RowList = ({ items, onClick }: { items: AnimeCard[]; onClick: (a: AnimeCard) => void }) => (
  <ul className="space-y-3">
    {items.map((a) => (
      <li key={a.id}>
        <button onClick={() => onClick(a)} className="flex items-center gap-3 w-full text-left group">
          <img src={a.cover} alt={a.title} loading="lazy"
            className="h-16 w-12 rounded-md object-cover border border-border shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate group-hover:text-primary transition">{a.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">• {a.type}</p>
          </div>
        </button>
      </li>
    ))}
  </ul>
);
