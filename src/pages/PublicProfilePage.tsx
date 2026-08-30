import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Cat,
  ChevronRight,
  CircleGauge,
  Clock3,
  Film,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Settings,
  Music2,
  ShieldBan,
  Sparkles,
  Users,
  Volume2,
  WalletCards,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "../components/EmptyState";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { useMessaging } from "../context/MessagingContext";
import { api, friendlyError } from "../lib/api";
import type {
  PublicPersonalityTrait,
  PublicUserProfile,
  UserTastes,
} from "../types";

const lifestyleItems = [
  { key: "cleanliness", label: "Cleanliness", low: "Relaxed", high: "Very tidy", icon: Sparkles },
  { key: "socialLevel", label: "Social energy", low: "Quiet time", high: "Very social", icon: Users },
  { key: "sleepSchedule", label: "Daily rhythm", low: "Early bird", high: "Night owl", icon: Clock3 },
  { key: "noiseTolerance", label: "Noise comfort", low: "Peaceful", high: "Lively", icon: Volume2 },
  { key: "guestsFrequency", label: "Having guests", low: "Rarely", high: "Often", icon: Users },
] as const;

export function PublicProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openConversation } = useMessaging();
  const [profile, setProfile] = useState<PublicUserProfile | null>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (id === user?.id) {
      navigate("/app/profile", { replace: true });
      return;
    }
    setProfile(undefined);
    setAvatarFailed(false);
    api
      .getPublicProfile(id)
      .then(setProfile)
      .catch((error) => {
        toast.error(friendlyError(error));
        setProfile(null);
      });
  }, [id, navigate, user?.id]);

  const firstName = profile?.displayName?.split(/\s+/)[0] || "this person";
  const traits = useMemo(() => getPersonalityTraits(profile), [profile]);

  if (profile === undefined) return <Loading label="Opening profile…" />;
  if (!profile)
    return (
      <EmptyState
        icon={Users}
        title="Profile unavailable"
        body="This profile may no longer be discoverable, or you may no longer be able to view each other."
        action={<Link to="/app/discover" className="btn-primary">Back to discover</Link>}
      />
    );

  const initials = (profile.displayName || "FlatMate member")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const housing = profile.housingPreference;
  const lifestyle = profile.lifestyleProfile;
  const age = profile.age ?? ageFromBirthDate(profile.birthDate);

  async function messageUser() {
    if (!id) return;
    setOpeningChat(true);
    try {
      const conversation = await openConversation(id);
      navigate(`/app/messages/${conversation.id}`);
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setOpeningChat(false);
    }
  }

  async function blockUser() {
    if (!id) return;
    setBlocking(true);
    try {
      await api.blockUser(id);
      toast.success(`${profile?.displayName || "User"} has been blocked`);
      navigate("/app/discover", { replace: true });
    } catch (error) {
      toast.error(friendlyError(error));
      setBlocking(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-center justify-between">
        <Link to="/app/discover" className="inline-flex items-center gap-2 text-sm font-bold text-[#61706b] hover:text-[#174f3f]">
          <ArrowLeft size={17} /> Back to discover
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-10 place-items-center rounded-xl border border-black/8 bg-white text-[#53605c] shadow-sm hover:border-[#b9c3be] hover:text-[#17221f]"
            aria-label="Profile options"
            aria-expanded={menuOpen}
          >
            <Settings size={18} />
          </button>
          {menuOpen && (
            <>
              <button className="fixed inset-0 z-10 cursor-default" aria-label="Close profile options" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-20 w-60 rounded-2xl border border-black/8 bg-white p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setConfirmBlock(true); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-[#b44f3a] hover:bg-[#fff2ed]"
                >
                  <ShieldBan size={17} />
                  <span>Block user<span className="mt-0.5 block text-[11px] font-medium text-[#8d716b]">You won’t see each other again</span></span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[30px] bg-[#174f3f] text-white shadow-[0_22px_60px_rgba(23,79,63,.18)]">
        <div className="absolute inset-0 soft-grid opacity-20" />
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-[#72b49b]/20 blur-2xl" />
        <div className="relative grid gap-7 p-6 sm:p-9 lg:grid-cols-[220px_1fr_auto] lg:items-end lg:p-11">
          <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-[28px] border border-white/15 bg-[#e1b76b] shadow-xl">
            {profile.avatarUrl && !avatarFailed ? (
              <img src={profile.avatarUrl} alt={`${profile.displayName || "User"}'s profile`} className="h-full w-full object-cover" onError={() => setAvatarFailed(true)} />
            ) : (
              <span className="grid h-full place-items-center font-[var(--font-display)] text-6xl font-black text-[#493817]">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a8dbc9]">FlatMate profile</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">{profile.displayName || "FlatMate member"}</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/75">
              {housing?.city && <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><MapPin size={14} /> {housing.city}{housing.countryCode ? `, ${housing.countryCode}` : ""}</span>}
              {age && <span className="rounded-full bg-white/10 px-3 py-2">{age} years old</span>}
              {profile.gender && profile.gender !== "PREFER_NOT_TO_SAY" && <span className="rounded-full bg-white/10 px-3 py-2">{formatLabel(profile.gender)}</span>}
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">{profile.bio || "Looking for a comfortable home and someone compatible to share it with."}</p>
          </div>
          <button type="button" onClick={messageUser} disabled={openingChat} className="inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-[#f3c568] px-5 py-3.5 text-sm font-black text-[#3f3217] shadow-lg hover:-translate-y-0.5 hover:bg-[#f7d17d] disabled:opacity-60">
            {openingChat ? <LoaderCircle size={17} className="animate-spin" /> : <MessageCircle size={17} />}
            {openingChat ? "Opening…" : `Message ${firstName}`}
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <ProfileSection icon={MapPin} title="Housing plans" subtitle="What they’re looking for in their next home">
            {housing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile icon={MapPin} label="Location" value={[housing.city, housing.countryCode].filter(Boolean).join(", ")} />
                <InfoTile icon={WalletCards} label="Monthly budget" value={`${formatMoney(housing.minMonthlyBudget, housing.currency)} – ${formatMoney(housing.maxMonthlyBudget, housing.currency)}`} />
                <InfoTile icon={CalendarDays} label="Move-in" value={housing.moveInDate ? formatDate(housing.moveInDate) : "Flexible"} />
                <InfoTile icon={ChevronRight} label="Preferred areas" value={housing.preferredAreas?.length ? housing.preferredAreas.join(", ") : "Open to suggestions"} />
              </div>
            ) : <MutedCopy text="Housing preferences haven’t been added yet." />}
          </ProfileSection>

          <ProfileSection icon={CircleGauge} title="Lifestyle" subtitle="The everyday details that make a home work">
            {lifestyle ? (
              <div className="space-y-5">
                {lifestyleItems.map(({ key, label, low, high, icon: Icon }) => {
                  const value = Number(lifestyle[key]) || 1;
                  return (
                    <div key={key}>
                      <div className="mb-2 flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-bold"><Icon size={15} className="text-[#27775f]" />{label}</span><span className="font-semibold text-[#78857f]">{value <= 2 ? low : value >= 4 ? high : "Balanced"}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#edf0eb]"><div className="h-full rounded-full bg-[#69aa91]" style={{ width: `${value * 20}%` }} /></div>
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-2 border-t border-black/6 pt-5">
                  <PreferenceChip icon={Cat} active={lifestyle.hasPets} label={lifestyle.hasPets ? "Has pets" : "No pets"} />
                  <PreferenceChip icon={Cat} active={lifestyle.petsAllowed} label={lifestyle.petsAllowed ? "Pets welcome" : "Pet-free home"} />
                  <PreferenceChip icon={BedDouble} active={!lifestyle.smokingAllowed} label={lifestyle.smokingAllowed ? "Smoking is okay" : "Smoke-free home"} />
                </div>
              </div>
            ) : <MutedCopy text="Lifestyle preferences haven’t been added yet." />}
          </ProfileSection>
        </div>

        <div className="space-y-6">
          <ProfileSection icon={Sparkles} title="Personality" subtitle="A snapshot from their assessments">
            {traits.length ? <div className="space-y-4">{traits.slice(0, 8).map((trait) => <TraitBar key={trait.trait} trait={trait} />)}</div> : <MutedCopy text="No personality insights are available yet." />}
          </ProfileSection>
          <TasteSection tastes={profile.tastes} />
        </div>
      </div>

      {confirmBlock && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#101c18]/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !blocking) setConfirmBlock(false); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="block-title" className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff0ea] text-[#b94e39]"><ShieldBan size={22} /></span>
              <button type="button" disabled={blocking} onClick={() => setConfirmBlock(false)} className="grid size-9 place-items-center rounded-xl text-[#77837f] hover:bg-[#f2f4f1]" aria-label="Cancel blocking"><X size={18} /></button>
            </div>
            <h2 id="block-title" className="mt-5 font-[var(--font-display)] text-2xl font-extrabold">Block {profile.displayName || "this user"}?</h2>
            <p className="mt-3 text-sm leading-6 text-[#67746f]">You’ll be hidden from each other across discovery and profiles. You can undo this later from your profile settings.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={blocking} onClick={() => setConfirmBlock(false)} className="btn-secondary">Cancel</button>
              <button type="button" disabled={blocking} onClick={blockUser} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b94e39] px-5 py-3 text-sm font-bold text-white hover:bg-[#9f3f2d] disabled:opacity-60">
                {blocking && <LoaderCircle size={16} className="animate-spin" />}{blocking ? "Blocking…" : "Block user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ icon: Icon, title, subtitle, children }: { icon: typeof MapPin; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="card p-6 sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e8f3ef] text-[#27775f]"><Icon size={19} /></span><div><h2 className="font-[var(--font-display)] text-xl font-extrabold">{title}</h2><p className="mt-0.5 text-xs text-[#82908b]">{subtitle}</p></div></div>{children}</section>;
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f4f6f2] p-4"><span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#86918c]"><Icon size={14} className="text-[#27775f]" />{label}</span><p className="mt-2 text-sm font-bold leading-5 text-[#34423d]">{value}</p></div>;
}

function PreferenceChip({ icon: Icon, active, label }: { icon: typeof Cat; active: boolean; label: string }) {
  return <span className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${active ? "bg-[#e6f2ed] text-[#246d57]" : "bg-[#f1f2ef] text-[#687570]"}`}><Icon size={14} />{label}</span>;
}

function TraitBar({ trait }: { trait: PublicPersonalityTrait }) {
  const percent = Math.max(0, Math.min(100, trait.score <= 1 ? trait.score * 100 : trait.score));
  return <div><div className="mb-2 flex justify-between text-xs"><span className="font-bold">{formatLabel(trait.trait)}</span><span className="font-black text-[#27775f]">{Math.round(percent)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0eb]"><div className="h-full rounded-full bg-[#e0b15e]" style={{ width: `${percent}%` }} /></div></div>;
}

function TasteSection({ tastes }: { tastes?: UserTastes | null }) {
  const music = [...(tastes?.favoriteArtists?.map(({ artist }) => artist.name) ?? []), ...(tastes?.musicGenres?.map(({ musicGenre }) => musicGenre.name) ?? [])];
  const films = [...(tastes?.favoriteMovies?.map(({ movie }) => movie.title) ?? []), ...(tastes?.movieGenres?.map(({ movieGenre }) => movieGenre.name) ?? [])];
  return <ProfileSection icon={Music2} title="Tastes" subtitle="Easy conversation starters">{music.length || films.length ? <div className="space-y-5">{music.length > 0 && <TasteGroup icon={Music2} label="Music" items={music} />}{films.length > 0 && <TasteGroup icon={Film} label="Films" items={films} />}</div> : <MutedCopy text="No favorite music or films have been shared yet." />}</ProfileSection>;
}

function TasteGroup({ icon: Icon, label, items }: { icon: typeof Music2; label: string; items: string[] }) {
  return <div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#7b8983]"><Icon size={15} className="text-[#27775f]" />{label}</p><div className="mt-3 flex flex-wrap gap-2">{items.slice(0, 8).map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-[#f0f4f1] px-3 py-2 text-xs font-bold text-[#4f5e58]">{item}</span>)}</div></div>;
}

function MutedCopy({ text }: { text: string }) { return <p className="rounded-2xl bg-[#f5f6f3] px-4 py-5 text-sm text-[#82908b]">{text}</p>; }

function getPersonalityTraits(profile?: PublicUserProfile | null): PublicPersonalityTrait[] {
  if (!profile) return [];
  if (Array.isArray(profile.personality)) return profile.personality;
  if (profile.personality && !Array.isArray(profile.personality)) return profile.personality.traits ?? profile.personality.traitScores ?? [];
  return profile.personalityTraits ?? profile.traitScores ?? [];
}

function ageFromBirthDate(value?: string | null) {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age > 0 && age < 120 ? age : null;
}

function formatLabel(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Flexible" : new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date); }
function formatMoney(value: number, currency: string) { try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value); } catch { return `${value.toLocaleString()} ${currency}`; } }
