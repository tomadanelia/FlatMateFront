import { useEffect, useState } from "react";
import {
  Check,
  Film,
  LoaderCircle,
  Music2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { api, friendlyError } from "../lib/api";
import type {
  ArtistSearchResult,
  MovieSearchResult,
  MusicGenre,
  MovieGenre,
  UserTastes,
} from "../types";

type SearchItem = ArtistSearchResult | MovieSearchResult;
type SectionProps = {
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof Music2;
  accent: string;
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
};

function TasteSection({
  title,
  eyebrow,
  description,
  icon: Icon,
  accent,
  genres,
  genreIds,
  onGenre,
  search,
  setSearch,
  results,
  selected,
  onItem,
  onSave,
  saving,
  itemLabel,
}: SectionProps) {
  const selectedIds = selected.map((item) => item.id);
  return (
    <section className="card overflow-hidden">
      <div className={`relative overflow-hidden p-6 sm:p-8 ${accent}`}>
        <div className="absolute -right-7 -top-10 rotate-12 text-white/15">
          <Icon size={180} strokeWidth={1} />
        </div>
        <div className="relative">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/75 text-[#174f3f] shadow-sm">
            <Icon size={23} />
          </span>
          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#174f3f]/65">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-2xl font-extrabold text-[#174f3f]">
            {title}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#174f3f]/70">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-7 p-6 sm:p-8">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-[#34423d]">Genres</p>
              <p className="mt-1 text-xs text-[#82908b]">
                Pick everything that sounds or feels like you.
              </p>
            </div>
            <span className="text-xs font-bold text-[#27775f]">
              {genreIds.length} picked
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {genres.map((genre) => {
              const picked = genreIds.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => onGenre(genre.id)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-bold ${picked ? "border-[#174f3f] bg-[#174f3f] text-white shadow-sm" : "border-[#dfe5df] bg-white text-[#596863] hover:border-[#9bbcaf] hover:bg-[#f6faf8]"}`}
                >
                  {picked && <Check size={13} className="mr-1 inline" />}
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-sm font-extrabold text-[#34423d]">{itemLabel}</p>
          <div className="relative mt-3">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#91a099]"
              size={17}
            />
            <input
              className="input pl-11"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${itemLabel.toLowerCase()}...`}
              aria-label={`Search ${itemLabel.toLowerCase()}`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#82908b] hover:bg-[#eef3ef]"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {search.length > 1 && results.length > 0 && (
            <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-[#e2e8e2] bg-white p-2 shadow-[0_12px_30px_rgba(37,53,47,.1)]">
              {results.map((item) => {
                const picked = selectedIds.includes(item.id);
                const name = "title" in item ? item.title : item.name;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItem(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f4f8f5]"
                  >
                    <span className="block text-sm font-bold text-[#34423d]">
                      {name}
                    </span>
                    {picked ? (
                      <Check size={17} className="shrink-0 text-[#27775f]" />
                    ) : (
                      <span className="text-xs font-bold text-[#27775f]">
                        Add
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {search.length > 1 && results.length === 0 && (
            <p className="mt-3 text-xs text-[#82908b]">
              No results yet. Try another search.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((item) => {
              const name = "title" in item ? item.title : item.name;
              return (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-2 rounded-full bg-[#eaf4ef] px-3 py-2 text-xs font-bold text-[#27775f]"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => onItem(item)}
                    aria-label={`Remove ${name}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-primary w-full sm:w-auto"
        >
          {saving ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          {saving ? "Saving choices..." : `Save ${eyebrow.toLowerCase()}`}
        </button>
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
    Promise.all([
      api.getMusicGenres(),
      api.getMovieGenres(),
      api.getTastes(user.id),
    ])
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
    const timeout = window.setTimeout(
      () =>
        api
          .searchArtists(artistSearch.trim())
          .then(setArtists)
          .catch((error) => toast.error(friendlyError(error))),
      280,
    );
    return () => window.clearTimeout(timeout);
  }, [artistSearch]);
  useEffect(() => {
    if (movieSearch.trim().length < 2) {
      setMovies([]);
      return;
    }
    const timeout = window.setTimeout(
      () =>
        api
          .searchMovies(movieSearch.trim())
          .then(setMovies)
          .catch((error) => toast.error(friendlyError(error))),
      280,
    );
    return () => window.clearTimeout(timeout);
  }, [movieSearch]);
  if (loading || !tastes)
    return <Loading label="Loading your taste profile..." />;
  const musicGenreIds = tastes.musicGenres.map(
      ({ musicGenre }) => musicGenre.id,
    ),
    movieGenreIds = tastes.movieGenres.map(({ movieGenre }) => movieGenre.id),
    favoriteArtists = tastes.favoriteArtists.map(({ artist }) => artist),
    favoriteMovies = tastes.favoriteMovies.map(({ movie }) => movie);
  const toggle = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
  const toggleItem = <T extends { id: string }>(items: T[], item: T) =>
    items.some((value) => value.id === item.id)
      ? items.filter((value) => value.id !== item.id)
      : [...items, item];
  async function saveMusic() {
    if (!user) return;
    setSaving("music");
    try {
      await api.saveMusicTastes(
        user.id,
        musicGenreIds,
        favoriteArtists.map((artist) => artist.id),
      );
      setTastes(await api.getTastes(user.id));
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
      await api.saveMovieTastes(
        user.id,
        movieGenreIds,
        favoriteMovies.map((movie) => movie.id),
      );
      setTastes(await api.getTastes(user.id));
      toast.success("Movie taste updated");
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setSaving(null);
    }
  }
  return (
    <div className="pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#174f3f] px-6 py-8 text-white shadow-[0_16px_45px_rgba(23,79,63,.18)] sm:px-10 sm:py-10">
        <div className="absolute -right-10 -top-16 text-[#f3c568]/20">
          <Sparkles size={230} strokeWidth={1} />
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#9ed5c2]">
            Your taste, your signal
          </p>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-5xl">
            Make your profile sound like you.
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-white/70">
            Choose the music and movies you would happily bring into a new home.
            Your picks help the right people find the overlap.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <TasteSection
          title="Your soundtrack"
          eyebrow="Music taste"
          description="Genres and artists that belong on your side of the aux cord."
          icon={Music2}
          accent="bg-[#dff2e8]"
          genres={genres}
          genreIds={musicGenreIds}
          onGenre={(id) =>
            setTastes({
              ...tastes,
              musicGenres: toggle(musicGenreIds, id).map((value) => ({
                musicGenre: genres.find((genre) => genre.id === value)!,
              })),
            })
          }
          search={artistSearch}
          setSearch={setArtistSearch}
          results={artists}
          selected={favoriteArtists}
          onItem={(item) =>
            setTastes({
              ...tastes,
              favoriteArtists: toggleItem(
                favoriteArtists,
                item as ArtistSearchResult,
              ).map((artist) => ({ artist })),
            })
          }
          onSave={saveMusic}
          saving={saving === "music"}
          itemLabel="Artists and musicians"
        />
        <TasteSection
          title="Your watchlist"
          eyebrow="Movie taste"
          description="The stories, worlds and directors you would always make time for."
          icon={Film}
          accent="bg-[#ffe8d7]"
          genres={movieGenres}
          genreIds={movieGenreIds}
          onGenre={(id) =>
            setTastes({
              ...tastes,
              movieGenres: toggle(movieGenreIds, id).map((value) => ({
                movieGenre: movieGenres.find((genre) => genre.id === value)!,
              })),
            })
          }
          search={movieSearch}
          setSearch={setMovieSearch}
          results={movies}
          selected={favoriteMovies}
          onItem={(item) =>
            setTastes({
              ...tastes,
              favoriteMovies: toggleItem(
                favoriteMovies,
                item as MovieSearchResult,
              ).map((movie) => ({ movie })),
            })
          }
          onSave={saveMovies}
          saving={saving === "movies"}
          itemLabel="Favorite movies"
        />
      </div>
    </div>
  );
}
