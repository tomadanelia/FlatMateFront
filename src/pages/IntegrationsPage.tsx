import { useEffect, useState } from "react";
import { ArrowRight, Check, Disc3, Film, Heart, LoaderCircle, Music2, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { api, friendlyError } from "../lib/api";
import type { ArtistSearchResult, MovieSearchResult, MusicGenre, MovieGenre, UserTastes } from "../types";

type SearchItem = ArtistSearchResult | MovieSearchResult;
type SectionProps = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof Music2;
  number: string;
  palette: "mint" | "peach";
  genres: { id: string; name: string }[];
  genreIds: string[];
  onGenre: (id: string) => void;
  search: string;
  setSearch: (value: string) => void;
  results: SearchItem[];
  selected: SearchItem[];
  onItem: (item: SearchItem) => void;
  onSave: () => void;
  saving: boolean;
  itemLabel: string;
  searchPlaceholder: string;
};

const tones = {
  mint: {
    wash: "bg-[#dff1e9]",
    icon: "bg-[#174f3f] text-white",
    soft: "bg-[#edf7f2] text-[#216b54]",
    line: "border-[#cfe5da]",
    art: "text-[#79ad99]/25",
  },
  peach: {
    wash: "bg-[#ffeadc]",
    icon: "bg-[#d87155] text-white",
    soft: "bg-[#fff2ea] text-[#b9533d]",
    line: "border-[#f1d6c8]",
    art: "text-[#e89c82]/25",
  },
};

function itemName(item: SearchItem) {
  return "title" in item ? item.title : item.name;
}

function TasteSection({
  id, title, eyebrow, description, icon: Icon, number, palette, genres,
  genreIds, onGenre, search, setSearch, results, selected, onItem,
  onSave, saving, itemLabel, searchPlaceholder,
}: SectionProps) {
  const selectedIds = selected.map((item) => item.id);
  const tone = tones[palette];
  const total = genreIds.length + selected.length;

  return (
    <section id={id} className="card scroll-mt-24 overflow-hidden rounded-[28px]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-start gap-4">
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm ${tone.icon}`}>
              <Icon size={22} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#73817c]">{number} · {eyebrow}</p>
              <h2 className="mt-1 font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[#17221f] sm:text-3xl">{title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e7d78]">{description}</p>
            </div>
          </div>

          <div className="mt-9">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[#2d3b36]">Pick your genres</p>
                <p className="mt-1 text-xs text-[#82908b]">Choose as many as feel like you.</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold ${tone.soft}`}>{genreIds.length} selected</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {genres.map((genre) => {
                const picked = genreIds.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    aria-pressed={picked}
                    onClick={() => onGenre(genre.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition ${picked ? `${tone.icon} border-transparent shadow-sm` : "border-[#dfe5df] bg-white text-[#596863] hover:-translate-y-0.5 hover:border-[#a8beb4] hover:bg-[#f8faf8]"}`}
                  >
                    {picked && <Check size={13} strokeWidth={3} />}
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-9 border-t border-[#edf0ec] pt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[#2d3b36]">{itemLabel}</p>
                <p className="mt-1 text-xs text-[#82908b]">Search and add the ones you always come back to.</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold ${tone.soft}`}>{selected.length} selected</span>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87958f]" size={18} />
              <input
                className="input h-13 rounded-2xl pl-12 pr-11"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={`Search ${itemLabel.toLowerCase()}`}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#82908b] hover:bg-[#eef3ef]" aria-label="Clear search">
                  <X size={15} />
                </button>
              )}
            </div>

            {search.trim().length > 1 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#e2e8e2] bg-white p-2 shadow-[0_16px_36px_rgba(37,53,47,.1)]">
                {results.length ? results.map((item) => {
                  const picked = selectedIds.includes(item.id);
                  const name = itemName(item);
                  return (
                    <button key={item.id} type="button" onClick={() => onItem(item)} className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f4f8f5]">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone.soft}`}><Icon size={16} /></span>
                        <span className="truncate text-sm font-bold text-[#34423d]">{name}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${picked ? tone.soft : "text-[#27775f] group-hover:bg-white"}`}>{picked ? "Added" : "+ Add"}</span>
                    </button>
                  );
                }) : (
                  <div className="px-4 py-7 text-center">
                    <Search className="mx-auto text-[#b1bbb7]" size={22} />
                    <p className="mt-2 text-sm font-bold text-[#5f6d68]">No matches found</p>
                    <p className="mt-1 text-xs text-[#929d99]">Try a different spelling or title.</p>
                  </div>
                )}
              </div>
            )}

            {selected.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.map((item) => {
                  const name = itemName(item);
                  return (
                    <span key={item.id} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${tone.soft}`}>
                      <Heart size={12} fill="currentColor" />{name}
                      <button type="button" onClick={() => onItem(item)} className="ml-0.5 rounded-full p-0.5 hover:bg-black/5" aria-label={`Remove ${name}`}><X size={13} /></button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-[#edf0ec] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[#82908b]">Update this anytime — your profile changes after you save.</p>
            <button type="button" onClick={onSave} disabled={saving} className="btn-primary shrink-0 rounded-2xl">
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? "Saving choices..." : `Save ${eyebrow.toLowerCase()}`}
            </button>
          </div>
        </div>

        <aside className={`relative overflow-hidden border-t p-6 lg:border-l lg:border-t-0 ${tone.line} ${tone.wash}`}>
          <Icon className={`absolute -bottom-10 -right-10 ${tone.art}`} size={180} strokeWidth={1} />
          <div className="relative flex h-full min-h-64 flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#51635c]/70">Profile preview</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-extrabold text-[#50615b]"><span className="size-1.5 rounded-full bg-[#45a47f]" /> Live</span>
            </div>
            {total ? (
              <div className="mt-8">
                <p className="font-[var(--font-display)] text-xl font-extrabold text-[#23332d]">{total} little clues about you</p>
                <p className="mt-2 text-xs leading-5 text-[#5e7069]">These picks help potential roommates spot the overlap.</p>
                <div className="mt-6 space-y-3">
                  {genreIds.slice(0, 3).map((genreId) => (
                    <div key={genreId} className="flex items-center gap-3 rounded-2xl bg-white/65 p-3 backdrop-blur-sm">
                      <span className={`grid size-8 place-items-center rounded-xl ${tone.icon}`}><Disc3 size={14} /></span>
                      <span className="text-xs font-extrabold text-[#33443e]">{genres.find((genre) => genre.id === genreId)?.name}</span>
                    </div>
                  ))}
                  {selected.slice(0, Math.max(0, 3 - Math.min(genreIds.length, 3))).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-white/65 p-3 backdrop-blur-sm">
                      <span className={`grid size-8 place-items-center rounded-xl ${tone.icon}`}><Heart size={14} /></span>
                      <span className="truncate text-xs font-extrabold text-[#33443e]">{itemName(item)}</span>
                    </div>
                  ))}
                </div>
                {total > 3 && <p className="mt-4 text-xs font-bold text-[#53665f]">+ {total - 3} more on your profile</p>}
              </div>
            ) : (
              <div className="my-auto py-10 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/70 text-[#53665f]"><Heart size={22} /></span>
                <p className="mt-4 text-sm font-extrabold text-[#43554e]">Your board is waiting</p>
                <p className="mx-auto mt-1 max-w-48 text-xs leading-5 text-[#687a73]">Start picking and your taste preview will come to life.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export function IntegrationsPage() {
  const { user } = useAuth();
  const [genres, setGenres] = useState<MusicGenre[]>([]);
  const [movieGenres, setMovieGenres] = useState<MovieGenre[]>([]);
  const [tastes, setTastes] = useState<UserTastes | null>(null);
  const [artistSearch, setArtistSearch] = useState("");
  const [movieSearch, setMovieSearch] = useState("");
  const [artists, setArtists] = useState<ArtistSearchResult[]>([]);
  const [movies, setMovies] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"music" | "movies" | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.getMusicGenres(), api.getMovieGenres(), api.getTastes(user.id)])
      .then(([music, films, selected]) => {
        setGenres(music);
        setMovieGenres(films);
        setTastes(selected);
      })
      .catch((error) => toast.error(friendlyError(error)))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (artistSearch.trim().length < 2) {
      setArtists([]);
      return;
    }
    const timeout = window.setTimeout(() => api.searchArtists(artistSearch.trim()).then(setArtists).catch((error) => toast.error(friendlyError(error))), 280);
    return () => window.clearTimeout(timeout);
  }, [artistSearch]);

  useEffect(() => {
    if (movieSearch.trim().length < 2) {
      setMovies([]);
      return;
    }
    const timeout = window.setTimeout(() => api.searchMovies(movieSearch.trim()).then(setMovies).catch((error) => toast.error(friendlyError(error))), 280);
    return () => window.clearTimeout(timeout);
  }, [movieSearch]);

  if (loading || !tastes) return <Loading label="Loading your taste profile..." />;

  const musicGenreIds = tastes.musicGenres.map(({ musicGenre }) => musicGenre.id);
  const movieGenreIds = tastes.movieGenres.map(({ movieGenre }) => movieGenre.id);
  const favoriteArtists = tastes.favoriteArtists.map(({ artist }) => artist);
  const favoriteMovies = tastes.favoriteMovies.map(({ movie }) => movie);
  const totalPicks = musicGenreIds.length + movieGenreIds.length + favoriteArtists.length + favoriteMovies.length;
  const toggle = (ids: string[], id: string) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
  const toggleItem = <T extends { id: string }>(items: T[], item: T) => items.some((value) => value.id === item.id) ? items.filter((value) => value.id !== item.id) : [...items, item];

  async function saveMusic() {
    if (!user) return;
    setSaving("music");
    try {
      await api.saveMusicTastes(user.id, musicGenreIds, favoriteArtists.map((artist) => artist.id));
      toast.success("Music taste updated");
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setSaving(null);
    }
  }

  async function saveMovies() {
    if (!user) return;
    setSaving("movies");
    try {
      await api.saveMovieTastes(user.id, movieGenreIds, favoriteMovies.map((movie) => movie.id));
      toast.success("Movie taste updated");
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="pb-8">
      <header className="relative overflow-hidden rounded-[32px] bg-[#174f3f] px-6 py-8 text-white shadow-[0_20px_55px_rgba(23,79,63,.2)] sm:px-10 sm:py-11 lg:px-12">
        <div className="soft-grid absolute inset-0 opacity-20" />
        <div className="absolute -right-12 -top-16 text-[#f3c568]/20"><Sparkles size={240} strokeWidth={1} /></div>
        <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-[#a7ddca]">Your taste, your signal</p>
            <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-5xl">The things that feel<br className="hidden sm:block" /> most like you.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">Share the artists, genres, and films you love. They make easy conversation starters — and help a future roommate recognize your vibe.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 pr-5 backdrop-blur-sm">
            <span className="grid size-11 place-items-center rounded-xl bg-[#f3c568] font-[var(--font-display)] text-lg font-black text-[#473719]">{totalPicks}</span>
            <span><span className="block text-xs font-extrabold">Profile picks</span><span className="mt-0.5 block text-[11px] text-white/60">Visible after saving</span></span>
          </div>
        </div>
      </header>

      <nav className="my-6 flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-2 shadow-[0_8px_30px_rgba(37,53,47,.05)] sm:flex-row">
        <a href="#music-taste" className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-sm font-extrabold text-[#34423d] hover:bg-[#edf7f2]">
          <span className="grid size-8 place-items-center rounded-lg bg-[#dff1e9] text-[#216b54]"><Music2 size={16} /></span>Music taste<ArrowRight className="ml-auto text-[#8a9893]" size={15} />
        </a>
        <a href="#movie-taste" className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-sm font-extrabold text-[#34423d] hover:bg-[#fff2ea]">
          <span className="grid size-8 place-items-center rounded-lg bg-[#ffeadc] text-[#b9533d]"><Film size={16} /></span>Movie taste<ArrowRight className="ml-auto text-[#8a9893]" size={15} />
        </a>
      </nav>

      <div className="space-y-6">
        <TasteSection
          id="music-taste" number="01" title="Build your soundtrack" eyebrow="Music taste"
          description="The genres and artists that would be playing while you cook, clean, or wind down at home."
          icon={Music2} palette="mint" genres={genres} genreIds={musicGenreIds}
          onGenre={(id) => setTastes({ ...tastes, musicGenres: toggle(musicGenreIds, id).map((value) => ({ musicGenre: genres.find((genre) => genre.id === value)! })) })}
          search={artistSearch} setSearch={setArtistSearch} results={artists} selected={favoriteArtists}
          onItem={(item) => setTastes({ ...tastes, favoriteArtists: toggleItem(favoriteArtists, item as ArtistSearchResult).map((artist) => ({ artist })) })}
          onSave={saveMusic} saving={saving === "music"} itemLabel="Favorite artists" searchPlaceholder="Search artists or musicians..."
        />
        <TasteSection
          id="movie-taste" number="02" title="Curate your movie shelf" eyebrow="Movie taste"
          description="The stories you quote, rewatch, recommend, or would happily put on for a cozy night in."
          icon={Film} palette="peach" genres={movieGenres} genreIds={movieGenreIds}
          onGenre={(id) => setTastes({ ...tastes, movieGenres: toggle(movieGenreIds, id).map((value) => ({ movieGenre: movieGenres.find((genre) => genre.id === value)! })) })}
          search={movieSearch} setSearch={setMovieSearch} results={movies} selected={favoriteMovies}
          onItem={(item) => setTastes({ ...tastes, favoriteMovies: toggleItem(favoriteMovies, item as MovieSearchResult).map((movie) => ({ movie })) })}
          onSave={saveMovies} saving={saving === "movies"} itemLabel="Favorite movies" searchPlaceholder="Search movie titles..."
        />
      </div>
    </div>
  );
}
