// Mock anime data structured like cihuynime.app — replace with API later.
export type AnimeCard = {
  id: string;
  title: string;
  jpTitle?: string;
  type: "TV" | "MOVIE" | "ONA" | "OVA";
  episodes: number;
  year: number;
  cover: string;   // portrait
  banner: string;  // landscape
  synopsis: string;
  genres: string[];
  rating?: string; // HD
  sub?: number;
  dub?: number;
};

const I = (id: number, banner: boolean) =>
  banner
    ? `https://s4.anilist.co/file/anilistcdn/media/anime/banner/${id}.jpg`
    : `https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx${id}.jpg`;

export const SPOTLIGHT: AnimeCard[] = [
  {
    id: "daemons-of-the-shadow-realm-195600",
    title: "Daemons of the Shadow Realm",
    jpTitle: "影の領域の悪魔たち",
    type: "TV", episodes: 4, year: 2026,
    cover: "https://image.tmdb.org/t/p/w500/nUZECCEQUCtu1WKW1Gll9Ba8V2J.jpg",
    banner: "https://image.tmdb.org/t/p/original/5rcEQ5AG617uTUpO2oPWPCx68Fk.jpg",
    synopsis: "In a remote mountain village under the watchful eyes of two stone guardians, the young Yuru contentedly lives off the land while staying close to the only family he has left—Asa, his precious twin sister. Asa, meanwhile, carries out a mysterious 'duty' on behalf of the village while locked in a cage.",
    genres: ["Fantasy", "Mystery", "Drama"], rating: "HD", sub: 4, dub: 0,
  },
  {
    id: "tensura-s4-182205",
    title: "That Time I Got Reincarnated as a Slime Season 4",
    jpTitle: "転生したらスライムだった件 第4期",
    type: "TV", episodes: 4, year: 2026,
    cover: "https://image.tmdb.org/t/p/w500/5rcEQ5AG617uTUpO2oPWPCx68Fk.jpg",
    banner: "https://image.tmdb.org/t/p/original/5rcEQ5AG617uTUpO2oPWPCx68Fk.jpg",
    synopsis: "Demon Lord Rimuru's dream of creating an alliance between humans and monsters takes a step closer to being realized.",
    genres: ["Action", "Fantasy", "Isekai"], rating: "HD", sub: 4, dub: 0,
  },
  {
    id: "mistress-kanan-190704",
    title: "Mistress Kanan is Devilishly Easy",
    jpTitle: "甘神さんちの縁結び",
    type: "TV", episodes: 4, year: 2026,
    cover: "https://image.tmdb.org/t/p/w500/ivvNPySFYbMOplZrfjWDjLLxt2h.jpg",
    banner: "https://image.tmdb.org/t/p/original/ivvNPySFYbMOplZrfjWDjLLxt2h.jpg",
    synopsis: "Kanan, a female demon, infiltrates a high school with the goal of devouring some delicious human souls.",
    genres: ["Romance", "Comedy", "Demons"], rating: "HD", sub: 4, dub: 0,
  },
  {
    id: "akanebanashi-196935",
    title: "Akane-banashi",
    jpTitle: "あかね噺",
    type: "TV", episodes: 4, year: 2026,
    cover: "https://image.tmdb.org/t/p/w500/g5U3kgL7gjfGElgU53Y9dYFYQHh.jpg",
    banner: "https://image.tmdb.org/t/p/original/g5U3kgL7gjfGElgU53Y9dYFYQHh.jpg",
    synopsis: "Akane Ousaki sets her sights on becoming a shin'uchi—pushing forward in the highly competitive world of rakugo.",
    genres: ["Drama", "Slice of Life"], rating: "HD", sub: 4, dub: 0,
  },
  {
    id: "kill-blue-198113",
    title: "KILL BLUE",
    jpTitle: "キルアオ",
    type: "TV", episodes: 3, year: 2026,
    cover: "https://image.tmdb.org/t/p/w500/sB2QsdsLIBpCt4Jx7Y7ehbGFbSY.jpg",
    banner: "https://image.tmdb.org/t/p/original/sB2QsdsLIBpCt4Jx7Y7ehbGFbSY.jpg",
    synopsis: "Juuzou Oogami is a legendary hitman transformed into a 13-year-old boy and ordered to infiltrate a middle school.",
    genres: ["Action", "Comedy", "School"], rating: "HD", sub: 3, dub: 0,
  },
  {
    id: "agents-four-seasons-190143",
    title: "Agents of the Four Seasons: Dance of Spring",
    jpTitle: "四季の代行者",
    type: "TV", episodes: 5, year: 2026,
    cover: "https://image.tmdb.org/t/p/w500/hOzDdq7FpZ7DcMMk0N88dzT5s2u.jpg",
    banner: "https://image.tmdb.org/t/p/original/hOzDdq7FpZ7DcMMk0N88dzT5s2u.jpg",
    synopsis: "When the Agent of Spring is abducted, spring itself vanishes—plunging the world into unending winter.",
    genres: ["Fantasy", "Adventure"], rating: "HD", sub: 5, dub: 0,
  },
];

export const TRENDING: AnimeCard[] = [
  ...SPOTLIGHT,
  { id: "witch-hat-147105", title: "Witch Hat Atelier", type: "ONA", episodes: 4, year: 2026,
    cover: I(147105, false), banner: I(147105, true), synopsis: "Coco dreams of becoming a witch.", genres: ["Fantasy"], rating: "HD" },
  { id: "appraiser-200769", title: "The Strongest Job is an Appraiser", type: "ONA", episodes: 5, year: 2026,
    cover: I(200769, false), banner: I(200769, true), synopsis: "Hibiki is suddenly transferred to another world.", genres: ["Isekai"], rating: "HD" },
  { id: "iruma-s4-184492", title: "Welcome to Demon School! Iruma-kun S4", type: "TV", episodes: 4, year: 2026,
    cover: I(184492, false), banner: I(184492, true), synopsis: "The fourth season of Mairimashita! Iruma-kun.", genres: ["Comedy", "Demons"], rating: "HD" },
  { id: "angel-next-door-170019", title: "The Angel Next Door Spoils Me Rotten 2", type: "TV", episodes: 4, year: 2026,
    cover: I(170019, false), banner: I(170019, true), synopsis: "Now a couple, Amane and Mahiru navigate school life.", genres: ["Romance", "Slice of Life"], rating: "HD" },
];

export const TOP_AIRING: AnimeCard[] = TRENDING.slice(0, 5);
export const MOST_POPULAR: AnimeCard[] = TRENDING.slice(0, 5);

export const MOST_FAVORITE: AnimeCard[] = [
  { id: "frieren-154587", title: "Frieren: Beyond Journey's End", type: "TV", episodes: 28, year: 2024,
    cover: I(154587, false), banner: I(154587, true), synopsis: "An elf mage reflects on her former companions.", genres: ["Adventure", "Fantasy"], rating: "HD" },
  { id: "gintama-final-114129", title: "Gintama: THE VERY FINAL", type: "MOVIE", episodes: 1, year: 2021,
    cover: I(114129, false), banner: I(114129, true), synopsis: "The final Gintama movie.", genres: ["Comedy", "Action"], rating: "HD" },
  { id: "gintama-s3-20996", title: "Gintama Season 3", type: "TV", episodes: 51, year: 2015,
    cover: I(20996, false), banner: I(20996, true), synopsis: "Continuation of Gintama.", genres: ["Comedy"], rating: "HD" },
  { id: "csm-reze-171627", title: "Chainsaw Man – The Movie: Reze Arc", type: "MOVIE", episodes: 1, year: 2025,
    cover: I(171627, false), banner: I(171627, true), synopsis: "Reze Arc theatrical release.", genres: ["Action", "Horror"], rating: "HD" },
  { id: "fmab-5114", title: "Fullmetal Alchemist: Brotherhood", type: "TV", episodes: 64, year: 2009,
    cover: I(5114, false), banner: I(5114, true), synopsis: "The Elric brothers seek the Philosopher's Stone.", genres: ["Adventure", "Drama"], rating: "HD" },
];

export const LATEST_COMPLETED = MOST_FAVORITE;
export const LATEST_EPISODES: AnimeCard[] = TRENDING;

export const GENRES = [
  "Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Drama", "Ecchi",
  "Fantasy", "Game", "Harem", "Historical", "Horror", "Isekai", "Josei", "Kids",
  "Magic", "Martial-arts", "Mecha", "Military", "Music", "Mystery", "Parody",
  "Police", "Psychological", "Romance", "Samurai", "School", "Sci-Fi", "Shoujo",
  "Slice of Life", "Space", "Sports", "Super Power", "Supernatural", "Thriller",
  "Vampire",
];

export const SCHEDULE = [
  { time: "9:30:00 AM", title: "Sazae-san", ep: 2829, id: "sazaesan-2406" },
  { time: "2:16:00 PM", title: "ONE PIECE", ep: 1159, id: "one-piece-21" },
  { time: "2:00:00 AM", title: "Beyond Time's Gaze", ep: 18, id: "beyond-times-gaze-205905" },
  { time: "2:00:00 AM", title: "Dou Po Cangqiong: Nian Fan 4", ep: 39, id: "dou-po-cangqiong-nian-fan-4-196613" },
  { time: "9:00:00 AM", title: "Holo no Graffiti", ep: 363, id: "holo-no-graffiti-118123" },
  { time: "12:00:00 PM", title: "NIPPON SANGOKU", ep: 4, id: "nippon-sangoku-206914" },
];
