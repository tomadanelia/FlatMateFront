import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  MapPin,
  PawPrint,
  Sparkles,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Brand } from "../components/Brand";
import { useAuth } from "../context/AuthContext";
import { api, friendlyError } from "../lib/api";
import {
  citiesForCountry,
  countrySuggestions,
} from "../data/locationSuggestions";
import type { Gender, ProfileInput } from "../types";

const stepMeta = [
  {
    title: "A little about you",
    subtitle: "Help future flatmates put a person to the profile.",
    icon: Users,
  },
  {
    title: "Where do you want to live?",
    subtitle: "We only match people whose plans and budgets overlap.",
    icon: MapPin,
  },
  {
    title: "What does home feel like?",
    subtitle: "There are no right answers — only honest ones.",
    icon: Home,
  },
];
const scaleLabels: Record<string, [string, string]> = {
  cleanliness: ["Relaxed", "Spotless"],
  socialLevel: ["Quiet time", "Very social"],
  sleepSchedule: ["Early bird", "Night owl"],
  noiseTolerance: ["Peaceful", "Lively"],
  guestsFrequency: ["Rarely", "Often"],
};

export function OnboardingPage() {
  const { user: sessionUser } = useAuth();
  const user = sessionUser!;
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    birthDate: "",
    gender: "" as Gender | "",
    bio: "",
    city: "",
    countryCode: "GE",
    minMonthlyBudget: 400,
    maxMonthlyBudget: 800,
    currency: "GEL",
    moveInDate: "",
    preferredAreas: "",
    cleanliness: 3,
    socialLevel: 3,
    sleepSchedule: 3,
    noiseTolerance: 3,
    guestsFrequency: 3,
    smokingAllowed: false,
    petsAllowed: true,
    hasPets: false,
  });
  useEffect(() => {
    if (user)
      api
        .getUser(user.id)
        .then((profile) => {
          if (profile?.onboardingComplete)
            navigate("/app/discover", { replace: true });
        })
        .catch(() => {});
  }, [user, navigate]);
  if (!user) return null;
  function next(e: FormEvent) {
    e.preventDefault();
    if (step < 2) setStep(step + 1);
    else finish();
  }
  async function finish() {
    setLoading(true);
    const payload: ProfileInput = {
      id: user.id,
      email: user.email,
      displayName: form.displayName.trim(),
      city: form.city.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      minMonthlyBudget: Number(form.minMonthlyBudget),
      maxMonthlyBudget: Number(form.maxMonthlyBudget),
      currency: form.currency.trim().toUpperCase(),
      cleanliness: form.cleanliness,
      socialLevel: form.socialLevel,
      sleepSchedule: form.sleepSchedule,
      noiseTolerance: form.noiseTolerance,
      guestsFrequency: form.guestsFrequency,
      smokingAllowed: form.smokingAllowed,
      petsAllowed: form.petsAllowed,
      hasPets: form.hasPets,
      ...(form.birthDate && { birthDate: form.birthDate }),
      ...(form.gender && { gender: form.gender }),
      ...(form.bio && { bio: form.bio.trim() }),
      ...(form.moveInDate && { moveInDate: form.moveInDate }),
      ...(form.preferredAreas && {
        preferredAreas: form.preferredAreas
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      }),
    };
    try {
      await api.saveProfile(payload);
      toast.success("Your profile is ready!");
      navigate("/app/assessments");
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }
  const MetaIcon = stepMeta[step].icon;
  return (
    <div className="min-h-screen bg-[#f7f6f0]">
      <header className="flex h-20 items-center border-b border-black/6 bg-white px-5 sm:px-8">
        <Brand />
        <button
          onClick={() => navigate("/")}
          className="ml-auto text-sm font-bold text-[#75817d]"
        >
          Save & exit
        </button>
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl lg:grid-cols-[300px_1fr]">
        <aside className="border-r border-black/6 px-6 py-10 lg:px-8">
          <p className="eyebrow">Set up your profile</p>
          <div className="mt-8 flex gap-2 lg:flex-col lg:gap-3">
            {stepMeta.map(({ title, icon: Icon }, i) => (
              <button
                key={title}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex flex-1 items-center gap-3 rounded-xl p-3 text-left ${i === step ? "bg-white shadow-sm" : i < step ? "text-[#27775f]" : "text-[#9aa39f]"}`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${i < step ? "bg-[#27775f] text-white" : i === step ? "bg-[#dff1ea] text-[#27775f]" : "bg-[#ebece8]"}`}
                >
                  {i < step ? <Check size={16} /> : <Icon size={16} />}
                </span>
                <span className="hidden text-sm font-bold lg:block">
                  {title}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-8 hidden rounded-2xl bg-[#e7f2ed] p-5 lg:block">
            <Sparkles className="text-[#27775f]" size={20} />
            <p className="mt-3 text-sm font-extrabold">Why we ask</p>
            <p className="mt-2 text-xs leading-5 text-[#61716b]">
              The more honest you are, the more useful your compatibility scores
              will be.
            </p>
          </div>
        </aside>
        <main className="flex justify-center px-5 py-10 sm:px-10 lg:py-14">
          <form onSubmit={next} className="w-full max-w-2xl">
            <div className="mb-3 flex items-center gap-3 text-[#27775f]">
              <span className="grid size-11 place-items-center rounded-xl bg-[#dff1ea]">
                <MetaIcon size={21} />
              </span>
              <span className="text-sm font-bold">Step {step + 1} of 3</span>
            </div>
            <h1 className="font-[var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">
              {stepMeta[step].title}
            </h1>
            <p className="mt-2 text-[#71807b]">{stepMeta[step].subtitle}</p>
            <div className="mt-4 flex gap-1.5">
              {stepMeta.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#27775f]" : "bg-[#dfe2dc]"}`}
                />
              ))}
            </div>
            {step === 0 && (
              <div className="mt-9 space-y-5">
                <div>
                  <label className="label">Display name</label>
                  <input
                    className="input"
                    required
                    maxLength={80}
                    value={form.displayName}
                    onChange={(e) =>
                      setForm({ ...form, displayName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      Date of birth{" "}
                      <span className="font-normal text-[#909a96]">
                        (optional)
                      </span>
                    </label>
                    <input
                      className="input"
                      type="date"
                      value={form.birthDate}
                      onChange={(e) =>
                        setForm({ ...form, birthDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">
                      Gender{" "}
                      <span className="font-normal text-[#909a96]">
                        (optional)
                      </span>
                    </label>
                    <select
                      className="input"
                      value={form.gender}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          gender: e.target.value as Gender | "",
                        })
                      }
                    >
                      <option value="">Choose an option</option>
                      <option value="WOMAN">Woman</option>
                      <option value="MAN">Man</option>
                      <option value="NON_BINARY">Non-binary</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="label">
                      Your mini introduction{" "}
                      <span className="font-normal text-[#909a96]">
                        (optional)
                      </span>
                    </label>
                    <span className="text-xs text-[#909a96]">
                      {form.bio.length}/1000
                    </span>
                  </div>
                  <textarea
                    className="input min-h-32 resize-y"
                    maxLength={1000}
                    placeholder="What would you want a future flatmate to know about you?"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="mt-9 space-y-5">
                <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
                  <div>
                    <label className="label">City</label>
                    <input
                      className="input"
                      required
                      placeholder="e.g. Tbilisi"
                      list="onboarding-city-suggestions"
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                    />
                    <datalist id="onboarding-city-suggestions">
                      {citiesForCountry(form.countryCode).map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="label">Country code</label>
                    <input
                      className="input uppercase"
                      required
                      minLength={2}
                      maxLength={2}
                      placeholder="GE"
                      list="onboarding-country-suggestions"
                      value={form.countryCode}
                      onChange={(e) =>
                        setForm({ ...form, countryCode: e.target.value })
                      }
                    />
                    <datalist id="onboarding-country-suggestions">
                      {countrySuggestions.map((country) => (
                        <option
                          key={country.code}
                          value={country.code}
                          label={country.name}
                        />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="rounded-2xl border border-black/6 bg-white p-5">
                  <div className="mb-4 flex justify-between">
                    <div>
                      <p className="label !mb-0">Monthly budget</p>
                      <p className="text-xs text-[#89938f]">
                        Your ranges must overlap to match
                      </p>
                    </div>
                    <input
                      className="w-20 rounded-lg border border-black/10 px-2 text-center text-sm font-bold uppercase"
                      required
                      minLength={3}
                      maxLength={3}
                      value={form.currency}
                      onChange={(e) =>
                        setForm({ ...form, currency: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#71807b]">
                        Minimum
                      </label>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        required
                        value={form.minMonthlyBudget}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            minMonthlyBudget: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <span className="pb-3 text-[#9aa39f]">—</span>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#71807b]">
                        Maximum
                      </label>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        required
                        value={form.maxMonthlyBudget}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            maxMonthlyBudget: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">
                    Ideal move-in date{" "}
                    <span className="font-normal text-[#909a96]">
                      (optional)
                    </span>
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={form.moveInDate}
                    onChange={(e) =>
                      setForm({ ...form, moveInDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">
                    Preferred areas{" "}
                    <span className="font-normal text-[#909a96]">
                      (optional)
                    </span>
                  </label>
                  <input
                    className="input"
                    placeholder="Vake, Saburtalo, Vera"
                    value={form.preferredAreas}
                    onChange={(e) =>
                      setForm({ ...form, preferredAreas: e.target.value })
                    }
                  />
                  <p className="mt-1.5 text-xs text-[#89938f]">
                    Separate neighborhoods with commas
                  </p>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="mt-9 space-y-4">
                {Object.entries(scaleLabels).map(([key, [low, high]]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-black/6 bg-white p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-extrabold capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="rounded-lg bg-[#e8f4ef] px-2.5 py-1 text-xs font-black text-[#27775f]">
                        {form[key as keyof typeof form]}/5
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() => setForm({ ...form, [key]: v })}
                          className={`h-10 rounded-lg text-sm font-extrabold ${form[key as keyof typeof form] === v ? "bg-[#27775f] text-white shadow-md" : "bg-[#f1f3ef] text-[#71807b] hover:bg-[#dff1ea]"}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] font-semibold text-[#919b97]">
                      <span>{low}</span>
                      <span>{high}</span>
                    </div>
                  </div>
                ))}
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["smokingAllowed", "Smoking is okay", "Smoking"],
                    ["petsAllowed", "Pets are welcome", "Pets"],
                    ["hasPets", "I have a pet", "My pet"],
                  ].map(([key, label, short]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() =>
                        setForm({
                          ...form,
                          [key]: !form[key as keyof typeof form],
                        })
                      }
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${form[key as keyof typeof form] ? "border-[#77b8a2] bg-[#edf7f3]" : "border-black/6 bg-white"}`}
                    >
                      <span
                        className={`grid size-9 place-items-center rounded-xl ${form[key as keyof typeof form] ? "bg-[#27775f] text-white" : "bg-[#f0f2ee] text-[#89938f]"}`}
                      >
                        {key.includes("pet") || key === "hasPets" ? (
                          <PawPrint size={17} />
                        ) : (
                          <span className="text-xs font-black">{short[0]}</span>
                        )}
                      </span>
                      <span className="text-xs font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-9 flex items-center justify-between">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
                className="btn-secondary disabled:invisible"
              >
                <ArrowLeft size={17} /> Back
              </button>
              <button disabled={loading} className="btn-primary">
                {loading
                  ? "Building profile…"
                  : step === 2
                    ? "Finish my profile"
                    : "Continue"}{" "}
                {!loading && <ArrowRight size={17} />}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
