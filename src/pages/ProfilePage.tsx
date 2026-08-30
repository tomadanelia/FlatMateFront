import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Film, Heart, ImagePlus, LoaderCircle, MapPin, Music2, RotateCcw, Save, ShieldBan, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { api, friendlyError } from "../lib/api";
import { citiesForCountry, countrySuggestions } from "../data/locationSuggestions";
import type { BlockedUser, BlockedUserRecord, Gender, ProfileInput, UserProfile, UserTastes } from "../types";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>();
  const [tastes, setTastes] = useState<UserTastes | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarInput, setAvatarInput] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  useEffect(() => {
    if (user)
      api
        .getUser(user.id)
        .then(setProfile)
        .catch((e) => {
          toast.error(friendlyError(e));
          setProfile(null);
        });
  }, [user]);
  useEffect(() => {
    setAvatarInput(profile?.avatarUrl ?? "");
    setAvatarFailed(false);
  }, [profile?.avatarUrl]);
  useEffect(() => {
    setCountryCode(profile?.housingPreference?.countryCode ?? "");
  }, [profile?.housingPreference?.countryCode]);
  useEffect(() => {
    if (user)
      api
        .getTastes(user.id)
        .then(setTastes)
        .catch(() => setTastes(null));
  }, [user]);
  if (profile === undefined) return <Loading label="Loading your profile…" />;
  if (!profile) return <div className="card p-8">Profile unavailable.</div>;
  const h = profile.housingPreference,
    l = profile.lifestyleProfile;
  if (!h || !l)
    return (
      <div className="card p-8">Complete onboarding to edit your profile.</div>
    );
  const existingIntegrations = profile.integrations;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload: ProfileInput = {
      id: user.id,
      email: user.email,
      displayName: String(fd.get("displayName")),
      birthDate: String(fd.get("birthDate") || "") || undefined,
      gender: (String(fd.get("gender") || "") || undefined) as
        Gender | undefined,
      bio: String(fd.get("bio") || "") || undefined,
      city: String(fd.get("city")),
      countryCode: String(fd.get("countryCode")),
      minMonthlyBudget: Number(fd.get("minMonthlyBudget")),
      maxMonthlyBudget: Number(fd.get("maxMonthlyBudget")),
      currency: String(fd.get("currency")),
      moveInDate: String(fd.get("moveInDate") || "") || undefined,
      preferredAreas: String(fd.get("preferredAreas") || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      cleanliness: Number(fd.get("cleanliness")),
      socialLevel: Number(fd.get("socialLevel")),
      sleepSchedule: Number(fd.get("sleepSchedule")),
      noiseTolerance: Number(fd.get("noiseTolerance")),
      guestsFrequency: Number(fd.get("guestsFrequency")),
      smokingAllowed: fd.get("smokingAllowed") === "on",
      petsAllowed: fd.get("petsAllowed") === "on",
      hasPets: fd.get("hasPets") === "on",
    };
    try {
      const next = await api.saveProfile(payload);
      setProfile({ ...next, integrations: existingIntegrations });
      updateUser({
        id: next.id,
        email: next.email,
        displayName: next.displayName,
        role: next.role,
      });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }
  async function saveAvatar(avatarUrl: string | null) {
    const nextUrl = avatarUrl?.trim() || null;
    if (nextUrl) {
      if (nextUrl.length > 2048) {
        toast.error("Photo URL must be 2,048 characters or fewer.");
        return;
      }
      try {
        const parsed = new URL(nextUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
          throw new Error();
      } catch {
        toast.error("Enter an absolute HTTP or HTTPS URL.");
        return;
      }
    }

    setAvatarLoading(true);
    try {
      const updated = await api.updateAvatar(nextUrl);
      setProfile((current) =>
        current ? { ...current, avatarUrl: updated.avatarUrl } : current,
      );
      setAvatarInput(updated.avatarUrl ?? "");
      toast.success(updated.avatarUrl ? "Profile picture updated" : "Profile picture removed");
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setAvatarLoading(false);
    }
  }
  const initials = (profile.displayName || profile.email)
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Your corner of FlatMate</p>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl font-extrabold tracking-tight">
            Profile & preferences
          </h1>
          <p className="mt-2 text-sm text-[#71807b]">
            Keep this current for stronger, more relevant matches.
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs font-bold text-[#27775f]">
          <ShieldCheck size={16} /> Sensitive API fields are never stored or
          displayed
        </span>
      </div>
      <TasteShowcase tastes={tastes} />
      <form
        onSubmit={submit}
        className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]"
      >
        <aside className="space-y-5">
          <div className="card p-6 text-center">
            {profile.avatarUrl && !avatarFailed ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.displayName || "User"}'s profile`}
                className="mx-auto size-24 rounded-3xl object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="mx-auto grid size-24 place-items-center rounded-3xl bg-[#e6bd69] font-[var(--font-display)] text-3xl font-black text-[#473719]">
                {initials}
              </span>
            )}
            <h2 className="mt-4 text-lg font-black">{profile.displayName}</h2>
            <p className="mt-1 text-xs text-[#82908b]">{profile.email}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#e7f3ee] px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#27775f]">
              <Check size={12} /> Profile complete
            </span>
            <div className="mt-5 border-t border-black/6 pt-5 text-left">
              <label htmlFor="avatarUrl" className="label">
                Profile picture URL
              </label>
              <input
                id="avatarUrl"
                type="url"
                inputMode="url"
                className="input"
                placeholder="https://images.example.com/profile.jpg"
                value={avatarInput}
                maxLength={2048}
                disabled={avatarLoading}
                onChange={(event) => setAvatarInput(event.target.value)}
              />
              <p className="mt-2 text-[11px] leading-4 text-[#82908b]">
                Paste an absolute HTTP or HTTPS image URL.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-primary min-w-0 flex-1 justify-center px-3"
                  disabled={avatarLoading || !avatarInput.trim()}
                  onClick={() => saveAvatar(avatarInput)}
                >
                  <ImagePlus size={15} />
                  {avatarLoading ? "Saving…" : "Update"}
                </button>
                {profile.avatarUrl && (
                  <button
                    type="button"
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e7d4cd] text-[#b4533d] transition hover:bg-[#fff1e9] disabled:opacity-50"
                    aria-label="Remove profile picture"
                    title="Remove profile picture"
                    disabled={avatarLoading}
                    onClick={() => saveAvatar(null)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#89938f]">
              Match visibility
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`size-2.5 rounded-full ${profile.isDiscoverable ? "bg-[#3faa82]" : "bg-[#b8bfbc]"}`}
              />
              <p className="text-sm font-bold">
                {profile.isDiscoverable
                  ? "Visible to matches"
                  : "Not discoverable"}
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#82908b]">
              Visibility cannot be changed with the current backend API.
            </p>
            <a href="#blocked-users" className="mt-4 flex items-center justify-between rounded-xl bg-[#f4f5f2] px-3.5 py-3 text-xs font-extrabold text-[#53605c] hover:bg-[#eaf2ee] hover:text-[#27775f]">
              <span className="flex items-center gap-2"><ShieldBan size={15} /> Blocked users</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </aside>
        <div className="space-y-6">
          <section className="card p-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e8f3ef] text-[#27775f]">
                <UserRound size={19} />
              </span>
              <h2 className="font-[var(--font-display)] text-xl font-extrabold">
                About you
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Display name">
                <input
                  name="displayName"
                  className="input"
                  required
                  defaultValue={profile.displayName || ""}
                />
              </Field>
              <Field label="Birth date">
                <input
                  name="birthDate"
                  type="date"
                  className="input"
                  defaultValue={profile.birthDate?.slice(0, 10) || ""}
                />
              </Field>
              <Field label="Gender">
                <select
                  name="gender"
                  className="input"
                  defaultValue={profile.gender || ""}
                >
                  <option value="">Not specified</option>
                  {[
                    "WOMAN",
                    "MAN",
                    "NON_BINARY",
                    "OTHER",
                    "PREFER_NOT_TO_SAY",
                  ].map((g) => (
                    <option key={g} value={g}>
                      {g.replaceAll("_", " ").toLowerCase()}
                    </option>
                  ))}
                </select>
              </Field>
              <div />
              <div className="sm:col-span-2">
                <Field label="Bio">
                  <textarea
                    name="bio"
                    className="input min-h-28"
                    maxLength={1000}
                    defaultValue={profile.bio || ""}
                  />
                </Field>
              </div>
            </div>
          </section>
          <section className="card p-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#fff1e9] text-[#c86850]">
                <MapPin size={19} />
              </span>
              <h2 className="font-[var(--font-display)] text-xl font-extrabold">
                Housing plans
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="City">
                <input
                  name="city"
                  className="input"
                  required
                  list="profile-city-suggestions"
                  defaultValue={h.city}
                />
                <datalist id="profile-city-suggestions">
                  {citiesForCountry(countryCode).map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </Field>
              <Field label="Country code">
                <input
                  name="countryCode"
                  className="input uppercase"
                  required
                  minLength={2}
                  maxLength={2}
                  list="profile-country-suggestions"
                  defaultValue={h.countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                />
                <datalist id="profile-country-suggestions">
                  {countrySuggestions.map((country) => (
                    <option
                      key={country.code}
                      value={country.code}
                      label={country.name}
                    />
                  ))}
                </datalist>
              </Field>
              <Field label="Currency">
                <input
                  name="currency"
                  className="input uppercase"
                  required
                  minLength={3}
                  maxLength={3}
                  defaultValue={h.currency}
                />
              </Field>
              <Field label="Minimum budget">
                <input
                  name="minMonthlyBudget"
                  type="number"
                  min={0}
                  className="input"
                  required
                  defaultValue={h.minMonthlyBudget}
                />
              </Field>
              <Field label="Maximum budget">
                <input
                  name="maxMonthlyBudget"
                  type="number"
                  min={1}
                  className="input"
                  required
                  defaultValue={h.maxMonthlyBudget}
                />
              </Field>
              <Field label="Move-in date">
                <input
                  name="moveInDate"
                  type="date"
                  className="input"
                  defaultValue={h.moveInDate?.slice(0, 10) || ""}
                />
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Preferred areas">
                  <input
                    name="preferredAreas"
                    className="input"
                    defaultValue={h.preferredAreas.join(", ")}
                  />
                </Field>
              </div>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="font-[var(--font-display)] text-xl font-extrabold">
              Lifestyle settings
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["cleanliness", "Cleanliness"],
                ["socialLevel", "Social level"],
                ["sleepSchedule", "Sleep schedule"],
                ["noiseTolerance", "Noise tolerance"],
                ["guestsFrequency", "Guests frequency"],
              ].map(([name, label]) => (
                <Field key={name} label={label}>
                  <input
                    name={name}
                    type="range"
                    min={1}
                    max={5}
                    className="w-full accent-[#27775f]"
                    defaultValue={l[name as keyof typeof l] as number}
                  />
                </Field>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                ["smokingAllowed", "Smoking allowed"],
                ["petsAllowed", "Pets allowed"],
                ["hasPets", "I have pets"],
              ].map(([name, label]) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#f3f5f1] px-4 py-3 text-sm font-bold"
                >
                  <input
                    name={name}
                    type="checkbox"
                    className="size-4 accent-[#27775f]"
                    defaultChecked={Boolean(l[name as keyof typeof l])}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
          <div className="flex justify-end">
            <button disabled={loading} className="btn-primary">
              <Save size={17} />
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
      <BlockedUsersSection />
    </div>
  );
}

function BlockedUsersSection() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .getBlockedUsers()
      .then((response) => {
        const records = Array.isArray(response) ? response : response.items;
        setBlockedUsers(records.map(normalizeBlockedUser).filter((item): item is BlockedUser => Boolean(item?.id)));
      })
      .catch((error) => toast.error(friendlyError(error)))
      .finally(() => setLoading(false));
  }, []);

  async function unblock(person: BlockedUser) {
    setUnblockingId(person.id);
    try {
      await api.unblockUser(person.id);
      setBlockedUsers((current) => current.filter((item) => item.id !== person.id));
      toast.success(`${person.displayName || "User"} has been unblocked`);
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <section id="blocked-users" className="card mt-8 scroll-mt-24 overflow-hidden" aria-labelledby="blocked-users-title">
      <div className="flex flex-col gap-4 border-b border-black/6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff0ea] text-[#b4533d]"><ShieldBan size={20} /></span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#96756d]">Privacy & safety</p>
            <h2 id="blocked-users-title" className="mt-1 font-[var(--font-display)] text-xl font-extrabold">Blocked users</h2>
          </div>
        </div>
        {!loading && <span className="self-start rounded-full bg-[#f1f3f0] px-3 py-1.5 text-xs font-bold text-[#6d7974] sm:self-auto">{blockedUsers.length} blocked</span>}
      </div>
      <div className="p-6 sm:p-7">
        <p className="max-w-2xl text-sm leading-6 text-[#71807b]">Blocked people can’t see your profile and won’t appear in your discovery results. Unblocking lets you find each other again.</p>
        {loading ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#f5f6f3] p-5 text-sm font-semibold text-[#71807b]"><LoaderCircle size={18} className="animate-spin text-[#27775f]" /> Loading blocked users…</div>
        ) : blockedUsers.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[#d8ded9] bg-[#fafbf8] px-5 py-9 text-center">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#eaf3ef] text-[#27775f]"><ShieldCheck size={20} /></span>
            <p className="mt-3 text-sm font-extrabold">Your block list is empty</p>
            <p className="mt-1 text-xs text-[#82908b]">Anyone you block will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-black/6 rounded-2xl border border-black/6">
            {blockedUsers.map((person) => {
              const initials = (person.displayName || "User").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
              const busy = unblockingId === person.id;
              return (
                <div key={person.id} className="flex items-center gap-3 p-4 sm:gap-4">
                  {person.avatarUrl ? <img src={person.avatarUrl} alt="" className="size-12 shrink-0 rounded-2xl object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e4b96b] text-sm font-black text-[#493817]">{initials}</span>}
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{person.displayName || "FlatMate member"}</p><p className="mt-0.5 text-xs text-[#82908b]">Blocked from interacting with you</p></div>
                  <button type="button" disabled={Boolean(unblockingId)} onClick={() => unblock(person)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#d9ddd7] bg-white px-3.5 py-2.5 text-xs font-bold text-[#34423d] hover:border-[#27775f] hover:text-[#27775f] disabled:opacity-50">
                    {busy ? <LoaderCircle size={14} className="animate-spin" /> : <RotateCcw size={14} />}{busy ? "Unblocking…" : "Unblock"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function normalizeBlockedUser(record: BlockedUserRecord): BlockedUser | null {
  if ("blocked" in record) return record.blocked;
  if ("blockedUser" in record) return record.blockedUser;
  if ("user" in record) return record.user;
  return record.id ? record : null;
}

function TasteShowcase({ tastes }: { tastes: UserTastes | null }) {
  const musicGenres = tastes?.musicGenres.map(({ musicGenre }) => musicGenre.name) ?? [];
  const artists = tastes?.favoriteArtists.map(({ artist }) => artist.name) ?? [];
  const movieGenres = tastes?.movieGenres.map(({ movieGenre }) => movieGenre.name) ?? [];
  const movies = tastes?.favoriteMovies.map(({ movie }) => movie.title) ?? [];
  const music = [...artists, ...musicGenres];
  const film = [...movies, ...movieGenres];
  const hasTastes = music.length + film.length > 0;

  return (
    <section className="mt-8 overflow-hidden rounded-[28px] border border-black/6 bg-[#174f3f] text-white shadow-[0_14px_45px_rgba(23,79,63,.14)]">
      <div className="grid lg:grid-cols-[250px_1fr]">
        <div className="relative overflow-hidden border-b border-white/10 p-6 sm:p-7 lg:border-b-0 lg:border-r">
          <Heart className="absolute -bottom-9 -right-7 text-[#f3c568]/15" size={130} strokeWidth={1} />
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#a7ddca]">On your profile</p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-extrabold">Things I love</h2>
            <p className="mt-2 text-xs leading-5 text-white/60">A quick glimpse of the soundtrack and stories you would bring home.</p>
            <Link to="/app/integrations" className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[#f3c568] hover:gap-3">
              {hasTastes ? "Edit my tastes" : "Add my favorites"}<ArrowRight size={14} />
            </Link>
          </div>
        </div>
        {hasTastes ? (
          <div className="grid sm:grid-cols-2">
            <TasteList icon={Music2} title="On repeat" items={music} className="border-b border-white/10 sm:border-b-0 sm:border-r" />
            <TasteList icon={Film} title="Movie night picks" items={film} />
          </div>
        ) : (
          <div className="flex min-h-44 items-center p-6 sm:p-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#f3c568]"><Heart size={19} /></span>
            <div className="ml-4">
              <p className="text-sm font-extrabold">Make your profile more personal</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Add favorite genres, artists, and films to give matches an easy conversation starter.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TasteList({ icon: Icon, title, items, className = "" }: { icon: typeof Music2; title: string; items: string[]; className?: string }) {
  return (
    <div className={`p-6 sm:p-7 ${className}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-xl bg-white/10 text-[#a7ddca]"><Icon size={15} /></span>
        <p className="text-xs font-extrabold uppercase tracking-[.12em] text-white/65">{title}</p>
      </div>
      {items.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.slice(0, 6).map((item, index) => (
            <span key={`${item}-${index}`} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85">{item}</span>
          ))}
          {items.length > 6 && <span className="rounded-full px-2 py-1.5 text-xs font-bold text-[#f3c568]">+{items.length - 6} more</span>}
        </div>
      ) : (
        <p className="mt-4 text-xs text-white/45">Nothing selected yet.</p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
