import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  BookOpenCheck,
  Braces,
  Check,
  ChevronRight,
  Gauge,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Loading } from "../components/Loading";
import { api, friendlyError } from "../lib/api";
import type {
  AlgorithmConfig,
  AlgorithmKey,
  Question,
  QuestionInput,
  QuestionKind,
  TestDefinition,
  TestSummary,
  UserRole,
} from "../types";

type Tab = "algorithms" | "questions" | "roles";
const algorithmCopy: Record<
  AlgorithmKey,
  { name: string; description: string; color: string }
> = {
  PERSONALITY: {
    name: "Personality",
    description: "Compares normalized trait scores from completed assessments.",
    color: "bg-[#e8f1ff] text-[#526ca3]",
  },
  TASTE: {
    name: "Taste",
    description: "Finds overlap across music, films, artists and genres.",
    color: "bg-[#fff0e9] text-[#bd654c]",
  },
  LIFESTYLE: {
    name: "Lifestyle",
    description: "Measures daily rhythms, habits and hard-boundary conflicts.",
    color: "bg-[#e6f4ee] text-[#27775f]",
  },
};

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("algorithms");
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#27775f]">
            <ShieldCheck size={15} /> Admin workspace
          </div>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl font-extrabold tracking-tight">
            Matching control center
          </h1>
          <p className="mt-2 text-sm text-[#71807b]">
            Manage scoring strategies, assessment questions and member access.
          </p>
        </div>
        <span className="self-start rounded-full border border-[#bcd4ca] bg-[#eaf4f0] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#27775f]">
          Admin access
        </span>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[230px_1fr]">
        <nav className="card h-fit p-2">
          {[
            ["algorithms", "Algorithms", SlidersHorizontal],
            ["questions", "Questions", BookOpenCheck],
            ["roles", "User roles", UserCog],
          ].map(([id, label, Icon]) => {
            const I = Icon as typeof Gauge;
            return (
              <button
                key={String(id)}
                onClick={() => setTab(id as Tab)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${tab === id ? "bg-[#174f3f] text-white shadow-md" : "text-[#64716d] hover:bg-[#f3f5f1]"}`}
              >
                <I size={18} />
                {String(label)}
                <ChevronRight size={15} className="ml-auto" />
              </button>
            );
          })}
          <div className="mx-3 my-3 border-t border-black/6" />
          <div className="px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9aa39f]">
              Environment
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs font-bold text-[#52605c]">
              <span className="size-2 rounded-full bg-[#42ad83]" /> API
              configured
            </p>
          </div>
        </nav>
        <div>
          {tab === "algorithms" ? (
            <AlgorithmsPanel />
          ) : tab === "questions" ? (
            <QuestionsPanel />
          ) : (
            <RolesPanel />
          )}
        </div>
      </div>
    </div>
  );
}

function AlgorithmsPanel() {
  const [configs, setConfigs] = useState<AlgorithmConfig[]>();
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => {
    api
      .getAlgorithms()
      .then(setConfigs)
      .catch((e) => {
        toast.error(friendlyError(e));
        setConfigs([]);
      });
  }, []);
  if (!configs) return <Loading label="Loading algorithms…" />;
  function updateLocal(key: AlgorithmKey, patch: Partial<AlgorithmConfig>) {
    setConfigs(configs!.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }
  async function save(config: AlgorithmConfig) {
    setSaving(config.key);
    try {
      let settings: Record<string, unknown> = {};
      if (typeof config.settings === "string")
        settings = JSON.parse(config.settings);
      else if (
        config.settings &&
        typeof config.settings === "object" &&
        !Array.isArray(config.settings)
      )
        settings = config.settings as Record<string, unknown>;
      const updated = await api.updateAlgorithm(config.key, {
        enabled: config.enabled,
        weight: Number(config.weight),
        version: config.version,
        settings,
      });
      updateLocal(config.key, updated);
      toast.success(`${algorithmCopy[config.key].name} updated`);
    } catch (e) {
      toast.error(
        e instanceof SyntaxError
          ? "Settings must be valid JSON"
          : friendlyError(e),
      );
    } finally {
      setSaving(null);
    }
  }
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={Activity}
          value={String(configs.filter((x) => x.enabled).length)}
          label="Active strategies"
        />
        <Stat
          icon={Gauge}
          value={configs.reduce((s, x) => s + x.weight, 0).toFixed(1)}
          label="Total raw weight"
        />
        <Stat
          icon={Braces}
          value={String(new Set(configs.map((x) => x.version)).size)}
          label="Versions in use"
        />
      </div>
      <div className="mt-6 space-y-4">
        {configs.map((config) => {
          const copy = algorithmCopy[config.key];
          return (
            <article key={config.key} className="card p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-2xl ${copy.color}`}
                >
                  <SlidersHorizontal size={21} />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-[var(--font-display)] text-xl font-extrabold">
                        {copy.name}
                      </h2>
                      <p className="mt-1 text-sm text-[#71807b]">
                        {copy.description}
                      </p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 rounded-full bg-[#f1f3ef] px-3 py-2 text-xs font-bold">
                      <input
                        type="checkbox"
                        className="size-4 accent-[#27775f]"
                        checked={config.enabled}
                        onChange={(e) =>
                          updateLocal(config.key, { enabled: e.target.checked })
                        }
                      />
                      {config.enabled ? "Enabled" : "Disabled"}
                    </label>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
                    <label>
                      <span className="label">Weight</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        className="input"
                        value={config.weight}
                        onChange={(e) =>
                          updateLocal(config.key, {
                            weight: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      <span className="label">Version</span>
                      <input
                        className="input"
                        value={config.version}
                        onChange={(e) =>
                          updateLocal(config.key, { version: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span className="label">Settings (JSON)</span>
                      <input
                        className="input font-mono text-xs"
                        value={
                          typeof config.settings === "string"
                            ? config.settings
                            : JSON.stringify(config.settings ?? {})
                        }
                        onChange={(e) =>
                          updateLocal(config.key, { settings: e.target.value })
                        }
                      />
                    </label>
                    <button
                      onClick={() => save(config)}
                      disabled={saving === config.key}
                      className="btn-primary !px-4"
                    >
                      <Save size={16} />
                      {saving === config.key ? "…" : "Save"}
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] text-[#98a19e]">
                    Last updated {new Date(config.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
        {configs.length === 0 && (
          <div className="card p-8 text-center text-sm text-[#71807b]">
            No algorithm configurations exist yet. They can be created by saving
            from the backend’s admin page.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Gauge;
  value: string;
  label: string;
}) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className="grid size-10 place-items-center rounded-xl bg-[#edf3f0] text-[#27775f]">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xl font-black">{value}</p>
        <p className="text-[11px] font-semibold text-[#89938f]">{label}</p>
      </div>
    </div>
  );
}

function QuestionsPanel() {
  const [tests, setTests] = useState<TestSummary[]>();
  const [selected, setSelected] = useState<TestSummary | null>(null);
  const [definition, setDefinition] = useState<TestDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => {
    api
      .getTests()
      .then(setTests)
      .catch((e) => {
        toast.error(friendlyError(e));
        setTests([]);
      });
  }, []);
  async function choose(test: TestSummary) {
    setSelected(test);
    setLoading(true);
    try {
      setDefinition(await api.getTest(test.slug));
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }
  if (!tests) return <Loading />;
  return (
    <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
      <aside className="card h-fit p-3">
        <div className="px-2 py-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#89938f]">
            Active test definitions
          </p>
        </div>
        {tests.map((t) => (
          <button
            key={t.id}
            onClick={() => choose(t)}
            className={`mt-1 w-full rounded-xl p-3 text-left ${selected?.id === t.id ? "bg-[#e9f3ef] text-[#174f3f]" : "hover:bg-[#f4f5f2]"}`}
          >
            <p className="text-sm font-bold">{t.name}</p>
            <p className="mt-1 text-[10px] uppercase text-[#8b9692]">
              {t.type.replace("_", " ")} · v{t.version}
            </p>
          </button>
        ))}
        {!tests.length && (
          <p className="p-4 text-xs leading-5 text-[#89938f]">
            No active tests are available.
          </p>
        )}
      </aside>
      <section>
        {!selected ? (
          <div className="card grid min-h-80 place-items-center p-8 text-center">
            <div>
              <BookOpenCheck className="mx-auto text-[#83a397]" size={32} />
              <h2 className="mt-4 font-[var(--font-display)] text-xl font-extrabold">
                Select an assessment
              </h2>
              <p className="mt-2 text-sm text-[#82908b]">
                Choose a test to view and manage its questions.
              </p>
            </div>
          </div>
        ) : loading ? (
          <Loading />
        ) : (
          <div>
            <div className="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="eyebrow">{selected.type.replace("_", " ")}</p>
                <h2 className="mt-1 font-[var(--font-display)] text-2xl font-extrabold">
                  {selected.name}
                </h2>
                <p className="mt-1 text-xs text-[#89938f]">
                  {definition?.questions.length || 0} questions · ID{" "}
                  {selected.id}
                </p>
              </div>
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="btn-primary self-start"
              >
                <Plus size={16} /> Add question
              </button>
            </div>
            {showAdd && (
              <AddQuestion
                testId={selected.id}
                nextPosition={(definition?.questions.length || 0) + 1}
                onAdded={() => {
                  setShowAdd(false);
                  choose(selected);
                }}
              />
            )}
            <div className="mt-4 space-y-3">
              {definition?.questions
                .sort((a, b) => a.position - b.position)
                .map((q) => (
                  <AdminQuestionRow
                    key={q.id}
                    question={q}
                    onUpdated={() => choose(selected)}
                  />
                ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function AdminQuestionRow({
  question,
  onUpdated,
}: {
  question: Question;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.updateQuestion(question.id, {
        code: String(fd.get("code")),
        prompt: String(fd.get("prompt")),
        kind: String(fd.get("kind")) as QuestionKind,
        position: Number(fd.get("position")),
        minValue: Number(fd.get("minValue")),
        maxValue: Number(fd.get("maxValue")),
      });
      toast.success("Question updated");
      setEditing(false);
      onUpdated();
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setSaving(false);
    }
  }

  if (editing)
    return (
      <form onSubmit={submit} className="card border-[#afcec2] p-5">
        <div className="grid gap-3 sm:grid-cols-[100px_1fr_160px]">
          <label>
            <span className="label">Position</span>
            <input
              name="position"
              type="number"
              min={1}
              className="input"
              defaultValue={question.position}
            />
          </label>
          <label>
            <span className="label">Code</span>
            <input
              name="code"
              className="input"
              required
              maxLength={50}
              defaultValue={question.code}
            />
          </label>
          <label>
            <span className="label">Kind</span>
            <select name="kind" className="input" defaultValue={question.kind}>
              {[
                "LIKERT",
                "SINGLE_CHOICE",
                "MULTIPLE_CHOICE",
                "BOOLEAN",
                "NUMBER",
                "TEXT",
              ].map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-3">
            <span className="label">Prompt</span>
            <textarea
              name="prompt"
              className="input min-h-20"
              required
              maxLength={1000}
              defaultValue={question.prompt}
            />
          </label>
          <label>
            <span className="label">Minimum</span>
            <input
              name="minValue"
              type="number"
              className="input"
              defaultValue={question.minValue ?? 1}
            />
          </label>
          <label>
            <span className="label">Maximum</span>
            <input
              name="maxValue"
              type="number"
              className="input"
              defaultValue={question.maxValue ?? 5}
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={saving} className="btn-primary">
            <Save size={15} />
            {saving ? "Saving…" : "Save question"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    );

  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef2ef] text-xs font-black text-[#66736f]">
        {question.position}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#27775f]">
            {question.code}
          </span>
          <span className="text-[10px] font-bold text-[#98a19e]">
            {question.kind}
          </span>
        </div>
        <p className="mt-1 text-sm font-bold leading-6">{question.prompt}</p>
        <p className="mt-1 text-[11px] text-[#98a19e]">
          Range {question.minValue ?? 1}–{question.maxValue ?? 5}
        </p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="grid size-9 shrink-0 place-items-center rounded-xl text-[#65736f] hover:bg-[#eaf4f0] hover:text-[#174f3f]"
        aria-label="Edit question"
      >
        <Pencil size={16} />
      </button>
    </div>
  );
}

function AddQuestion({
  testId,
  nextPosition,
  onAdded,
}: {
  testId: string;
  nextPosition: number;
  onAdded: () => void;
}) {
  const [saving, setSaving] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: QuestionInput = {
      code: String(fd.get("code")),
      prompt: String(fd.get("prompt")),
      trait: String(fd.get("trait")),
      kind: String(fd.get("kind")) as QuestionKind,
      position: Number(fd.get("position")),
      reverseScored: fd.get("reverseScored") === "on",
      minValue: Number(fd.get("minValue")),
      maxValue: Number(fd.get("maxValue")),
      weight: Number(fd.get("weight")),
    };
    setSaving(true);
    try {
      await api.addQuestions(testId, [input]);
      toast.success("Question added");
      onAdded();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit} className="card mt-4 border-[#afcec2] p-5">
      <h3 className="font-[var(--font-display)] text-lg font-extrabold">
        New question
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label>
          <span className="label">Code</span>
          <input
            name="code"
            className="input"
            required
            maxLength={50}
            placeholder="Q_01"
          />
        </label>
        <label>
          <span className="label">Trait</span>
          <input
            name="trait"
            className="input"
            required
            maxLength={100}
            placeholder="openness"
          />
        </label>
        <label>
          <span className="label">Kind</span>
          <select name="kind" className="input" defaultValue="LIKERT">
            {[
              "LIKERT",
              "SINGLE_CHOICE",
              "MULTIPLE_CHOICE",
              "BOOLEAN",
              "NUMBER",
              "TEXT",
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-3">
          <span className="label">Prompt</span>
          <textarea
            name="prompt"
            className="input min-h-24"
            required
            maxLength={1000}
          />
        </label>
        <label>
          <span className="label">Position</span>
          <input
            name="position"
            type="number"
            min={1}
            className="input"
            required
            defaultValue={nextPosition}
          />
        </label>
        <label>
          <span className="label">Minimum</span>
          <input
            name="minValue"
            type="number"
            className="input"
            defaultValue={1}
          />
        </label>
        <label>
          <span className="label">Maximum</span>
          <input
            name="maxValue"
            type="number"
            className="input"
            defaultValue={5}
          />
        </label>
        <label>
          <span className="label">Weight</span>
          <input
            name="weight"
            type="number"
            min={0}
            step="0.1"
            className="input"
            defaultValue={1}
          />
        </label>
        <label className="flex items-end gap-2 pb-3 text-sm font-bold">
          <input
            name="reverseScored"
            type="checkbox"
            className="size-4 accent-[#27775f]"
          />{" "}
          Reverse scored
        </label>
      </div>
      <button disabled={saving} className="btn-primary mt-5">
        <Plus size={16} />
        {saving ? "Creating…" : "Create question"}
      </button>
    </form>
  );
}

function RolesPanel() {
  const [id, setId] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api.updateRole(id.trim(), role);
      toast.success(
        `${updated.displayName || updated.email} is now ${updated.role}`,
      );
      setId("");
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-black/6 bg-[#fafbf8] p-6">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#e5f2ed] text-[#27775f]">
          <UserCog size={22} />
        </span>
        <h2 className="mt-4 font-[var(--font-display)] text-2xl font-extrabold">
          Change member access
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71807b]">
          Grant or revoke admin access using an exact user UUID. Existing JWTs
          retain their old role until that user signs in again.
        </p>
      </div>
      <form onSubmit={submit} className="p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <label>
            <span className="label">User ID</span>
            <input
              className="input font-mono text-xs"
              required
              pattern="[0-9a-fA-F-]{36}"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </label>
          <label>
            <span className="label">New role</span>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <button disabled={loading} className="btn-primary">
            <Check size={16} />
            {loading ? "Updating…" : "Update role"}
          </button>
        </div>
        <div className="mt-6 rounded-xl border border-[#f2d4a2] bg-[#fff8e8] p-4">
          <p className="text-xs font-bold text-[#805d1e]">
            Permission changes are sensitive. Double-check the user ID and
            intended role before submitting.
          </p>
        </div>
      </form>
    </div>
  );
}
