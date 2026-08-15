import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  Cat,
  Check,
  ChevronDown,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "../components/EmptyState";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { api, friendlyError } from "../lib/api";
import type { AlgorithmKey, MatchResult, UserProfile } from "../types";

const algoNames: Record<AlgorithmKey, string> = {
  PERSONALITY: "Personality",
  TASTE: "Shared tastes",
  LIFESTYLE: "Lifestyle",
};
const swatches = [
  "bg-[#e0b26a]",
  "bg-[#76b59e]",
  "bg-[#dd8d75]",
  "bg-[#8d9cca]",
  "bg-[#ac8bb5]",
];

export function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null | undefined>();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [algorithms, setAlgorithms] = useState<AlgorithmKey[]>([]);
  const [saved, setSaved] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("havenly_saved") || "[]"),
  );
  useEffect(() => {
    if (!user) return;
    api
      .getUser(user.id)
      .then((p) => {
        setProfile(p);
        if (!p?.onboardingComplete) {
          navigate("/onboarding");
          return;
        }
        return runSearch();
      })
      .catch((e) => {
        toast.error(friendlyError(e));
        setLoading(false);
      });
  }, [user?.id]);
  async function runSearch(selected = algorithms) {
    if (!user) return;
    setSearching(true);
    try {
      const result = await api.searchMatches({
        userId: user.id,
        limit: 24,
        ...(selected.length && { algorithms: selected }),
      });
      setMatches(result.matches);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }
  function toggleSaved(id: string) {
    const next = saved.includes(id)
      ? saved.filter((x) => x !== id)
      : [...saved, id];
    setSaved(next);
    localStorage.setItem("havenly_saved", JSON.stringify(next));
    toast.success(
      saved.includes(id) ? "Removed from favorites" : "Saved to favorites",
    );
  }
  const avg = useMemo(
    () =>
      matches.length
        ? Math.round(
            (matches.reduce((s, m) => s + m.score, 0) / matches.length) * 100,
          )
        : 0,
    [matches],
  );
  if (loading || profile === undefined)
    return <Loading label="Finding compatible flatmates…" />;
  return (
    <div>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Your people are out there</p>
          <h1 className="mt-2 font-[var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Discover flatmates
          </h1>
          <p className="mt-2 text-sm text-[#71807b]">
            Matches in{" "}
            <strong className="text-[#34423d]">
              {profile?.housingPreference?.city}
            </strong>{" "}
            based on the life you want to share.
          </p>
        </div>
        <button
          onClick={() => runSearch()}
          disabled={searching}
          className="btn-secondary self-start"
        >
          <RefreshCw size={16} className={searching ? "animate-spin" : ""} />
          {searching ? "Refreshing…" : "Refresh matches"}
        </button>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <span className="grid size-11 place-items-center rounded-xl bg-[#e5f2ed] text-[#27775f]">
            <Users size={20} />
          </span>
          <div>
            <p className="text-2xl font-black">{matches.length}</p>
            <p className="text-xs font-semibold text-[#81908a]">
              Compatible people
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="grid size-11 place-items-center rounded-xl bg-[#fff0e9] text-[#c86850]">
            <Heart size={20} />
          </span>
          <div>
            <p className="text-2xl font-black">
              {avg || "—"}
              {avg ? "%" : ""}
            </p>
            <p className="text-xs font-semibold text-[#81908a]">
              Average compatibility
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="grid size-11 place-items-center rounded-xl bg-[#fff5da] text-[#a5781a]">
            <MapPin size={20} />
          </span>
          <div>
            <p className="truncate text-lg font-black">
              {profile?.housingPreference?.city || "Not set"}
            </p>
            <p className="text-xs font-semibold text-[#81908a]">
              Search location
            </p>
          </div>
        </div>
      </div>
      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-3 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2 px-2 text-sm font-extrabold">
          <SlidersHorizontal size={17} className="text-[#27775f]" /> Match by
        </span>
        <div className="flex flex-1 flex-wrap gap-2">
          {(["PERSONALITY", "TASTE", "LIFESTYLE"] as AlgorithmKey[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => {
                  const next = algorithms.includes(key)
                    ? algorithms.filter((x) => x !== key)
                    : [...algorithms, key];
                  setAlgorithms(next);
                  runSearch(next);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${algorithms.includes(key) ? "bg-[#174f3f] text-white" : "bg-[#f1f3ef] text-[#5d6a66]"}`}
              >
                {algoNames[key]}
              </button>
            ),
          )}
        </div>
        <span className="px-2 text-[11px] text-[#919b97]">
          {algorithms.length
            ? "Using selected signals"
            : "Using all available signals"}
        </span>
      </div>
      <div className="mt-7">
        {matches.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches just yet"
            body="We couldn't find an overlapping profile this time. Try broadening your budget, checking your city spelling, or invite someone you know to join."
            action={
              <Link to="/app/profile" className="btn-primary">
                Review my preferences <ArrowRight size={16} />
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((match, i) => (
              <MatchCard
                key={match.user.id}
                match={match}
                color={swatches[i % swatches.length]}
                saved={saved.includes(match.user.id)}
                onSave={() => toggleSaved(match.user.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  color,
  saved,
  onSave,
}: {
  match: MatchResult;
  color: string;
  saved: boolean;
  onSave: () => void;
}) {
  const percent = Math.round(match.score * 100);
  const lifestyle = match.breakdown.find((b) => b.key === "LIFESTYLE");
  const initials = (match.user.displayName || "Havenly member")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);
  return (
    <article className="card group overflow-hidden">
      <div className={`relative h-56 ${color}`}>
        <div className="absolute inset-0 soft-grid opacity-20" />
        {match.user.avatarUrl ? (
          <img
            src={match.user.avatarUrl}
            className="h-full w-full object-cover"
            alt=""
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid size-28 place-items-center rounded-full border-8 border-white/20 bg-white/35 font-[var(--font-display)] text-4xl font-black text-white backdrop-blur-sm">
              {initials}
            </span>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#174f3f] shadow-sm">
          #{match.rank} match
        </span>
        <button
          onClick={onSave}
          className={`absolute right-4 top-4 grid size-10 place-items-center rounded-full shadow-sm ${saved ? "bg-[#f18b6d] text-white" : "bg-white text-[#53605c]"}`}
          aria-label="Save"
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h2 className="font-[var(--font-display)] text-2xl font-extrabold text-white drop-shadow-sm">
              {match.user.displayName || "Havenly member"}
            </h2>
          </div>
          <div className="grid size-14 place-items-center rounded-full border-4 border-white bg-[#174f3f] text-sm font-black text-white shadow-md">
            {percent}%
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-[#65736f]">
          {match.user.bio ||
            "Looking for a comfortable, compatible home and a great person to share it with."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {match.breakdown.map((b) => (
            <span
              key={b.key}
              className="flex items-center gap-1.5 rounded-lg bg-[#f1f5f2] px-2.5 py-1.5 text-[11px] font-bold text-[#53605c]"
            >
              <Check size={12} className="text-[#3d9678]" />
              {algoNames[b.key]} {Math.round(b.score * 100)}%
            </span>
          ))}
        </div>
        {lifestyle && (
          <div className="mt-4 flex items-center gap-4 border-t border-black/6 pt-4 text-xs font-semibold text-[#77847f]">
            <span className="flex items-center gap-1.5">
              <BedDouble size={15} /> Lifestyle fit
            </span>
            <span className="flex items-center gap-1.5">
              <Cat size={15} /> Boundaries checked
            </span>
          </div>
        )}
        <button
          onClick={() =>
            toast.info("Messaging is not available in the current backend API.")
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#174f3f] py-3 text-sm font-bold text-white group-hover:bg-[#103e31]"
        >
          View compatibility <ChevronDown size={16} />
        </button>
      </div>
    </article>
  );
}
