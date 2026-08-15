import { useEffect, useState, type FormEvent } from "react";
import { Check, MapPin, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { api, friendlyError } from "../lib/api";
import type { Gender, ProfileInput, UserProfile } from "../types";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (user)
      api
        .getUser(user.id)
        .then(setProfile)
        .catch((e) => {
          toast.error(friendlyError(e));
          setProfile(null);
        });
  }, [user?.id]);
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
        | Gender
        | undefined,
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
          <p className="eyebrow">Your corner of Havenly</p>
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
      <form
        onSubmit={submit}
        className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]"
      >
        <aside className="space-y-5">
          <div className="card p-6 text-center">
            <span className="mx-auto grid size-24 place-items-center rounded-3xl bg-[#e6bd69] font-[var(--font-display)] text-3xl font-black text-[#473719]">
              {initials}
            </span>
            <h2 className="mt-4 text-lg font-black">{profile.displayName}</h2>
            <p className="mt-1 text-xs text-[#82908b]">{profile.email}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#e7f3ee] px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#27775f]">
              <Check size={12} /> Profile complete
            </span>
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
                  defaultValue={h.city}
                />
              </Field>
              <Field label="Country code">
                <input
                  name="countryCode"
                  className="input uppercase"
                  required
                  minLength={2}
                  maxLength={2}
                  defaultValue={h.countryCode}
                />
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
