import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AnimeCard } from "@/data/anime";

export type FavoriteRow = {
  anime_id: string;
  title: string;
  cover: string | null;
  banner: string | null;
  type: string | null;
  episodes: number | null;
  year: number | null;
};

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    setLoading(true);
    const { data } = await supabase.from("favorites").select("anime_id,title,cover,banner,type,episodes,year").order("created_at", { ascending: false });
    setFavorites(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isFavorite = (id: string) => favorites.some((f) => f.anime_id === id);

  const toggle = async (a: AnimeCard) => {
    if (!user) return { needAuth: true as const, action: null as null };
    const wasFav = isFavorite(a.id);
    if (wasFav) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("anime_id", a.id);
      if (error) return { needAuth: false as const, action: "error" as const, error: error.message };
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id, anime_id: a.id, title: a.title, cover: a.cover,
        banner: a.banner, type: a.type, episodes: a.episodes, year: a.year,
      });
      if (error) return { needAuth: false as const, action: "error" as const, error: error.message };
    }
    await refresh();
    return { needAuth: false as const, action: wasFav ? ("removed" as const) : ("added" as const) };
  };

  return { favorites, loading, isFavorite, toggle, refresh };
};
