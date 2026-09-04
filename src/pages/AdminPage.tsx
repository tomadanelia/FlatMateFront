import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  BookOpenCheck,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Film,
  Gauge,
  LoaderCircle,
  Music,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Loading } from "../components/Loading";
import { api, friendlyError } from "../lib/api";
import type {
  AlgorithmConfig,
  AlgorithmKey,
  AdminUser,
  AdminUserCompletionStatus,
  CompletedPersonalityTestStatus,
  Question,
  QuestionInput,
  QuestionKind,
  TestDefinition,
  TestSummary,
  UserRole,
} from "../types";

type Tab = "algorithms" | "questions" | "users" | "roles";
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
  BUDGET: {
    name: "Budget",
    description: "Measures how closely users' housing budget ranges overlap.",
    color: "bg-[#f4edff] text-[#7655a6]",
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
            ["users", "Users", Users],
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
          ) : tab === "users" ? (
            <UsersPanel />
          ) : (
            <RolesPanel />
          )}
        </div>
      </div>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>();
  const [usersByStatus, setUsersByStatus] = useState<
    Partial<Record<CompletedPersonalityTestStatus, AdminUser[]>>
  >({});
  const [testFilter, setTestFilter] = useState<
    "ALL" | CompletedPersonalityTestStatus
  >("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [completion, setCompletion] =
    useState<AdminUserCompletionStatus | null>(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .getAdminUsers()
      .then(setUsers)
      .catch((error) => {
        toast.error(friendlyError(error));
        setUsers([]);
      });

    const statuses: CompletedPersonalityTestStatus[] = [
      "SHORT_ONLY",
      "LONG_ONLY",
      "BOTH",
    ];
    Promise.allSettled(
      statuses.map(async (status) => {
        const result = await api.getAdminUsersByTestStatus(status);
        return [status, result] as const;
      }),
    ).then((results) => {
      const next: Partial<
        Record<CompletedPersonalityTestStatus, AdminUser[]>
      > = {};
      let failed = false;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          next[result.value[0]] = result.value[1];
        } else {
          failed = true;
        }
      });
      setUsersByStatus(next);
      if (failed) toast.error("Some test statistics could not be loaded");
    });
  }, []);

  useEffect(() => {
    if (!selected) {
      setCompletion(null);
      setCompletionError(null);
      setConfirmDelete(false);
      return;
    }

    let active = true;
    setCompletion(null);
    setCompletionError(null);
    setCompletionLoading(true);
    api
      .getAdminUserCompletionStatus(selected.id)
      .then((result) => {
        if (active) setCompletion(result);
      })
      .catch((error) => {
        if (active) setCompletionError(friendlyError(error));
      })
      .finally(() => {
        if (active) setCompletionLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || deleting) return;
      if (confirmDelete) setConfirmDelete(false);
      else setSelected(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected, deleting, confirmDelete]);

  const query = search.trim().toLocaleLowerCase();
  const sourceUsers =
    testFilter === "ALL" ? users ?? [] : usersByStatus[testFilter] ?? [];
  const filteredUsers = sourceUsers.filter(
    (user) =>
      !query ||
      (user.displayName ?? "").toLocaleLowerCase().includes(query) ||
      (user.email ?? "").toLocaleLowerCase().includes(query) ||
      user.id.toLocaleLowerCase().includes(query),
  );

  async function deleteUser() {
    if (!selected) return;
    setDeleting(true);
    try {
      const deleted = await api.deleteAdminUser(selected.id);
      setUsers((current) => current?.filter((user) => user.id !== deleted.id));
      setUsersByStatus((current) => ({
        SHORT_ONLY: current.SHORT_ONLY?.filter((user) => user.id !== deleted.id),
        LONG_ONLY: current.LONG_ONLY?.filter((user) => user.id !== deleted.id),
        BOTH: current.BOTH?.filter((user) => user.id !== deleted.id),
      }));
      setSelected(null);
      toast.success(`${selected.displayName || deleted.email} was deleted`);
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setDeleting(false);
    }
  }

  if (!users) return <Loading label="Loading users…" />;

  const filters: {
    value: "ALL" | CompletedPersonalityTestStatus;
    label: string;
    count: number | undefined;
  }[] = [
    { value: "ALL", label: "All users", count: users.length },
    { value: "SHORT_ONLY", label: "Short only", count: usersByStatus.SHORT_ONLY?.length },
    { value: "LONG_ONLY", label: "Long only", count: usersByStatus.LONG_ONLY?.length },
    { value: "BOTH", label: "Both tests", count: usersByStatus.BOTH?.length },
  ];

  const statusLabels: Record<
    AdminUserCompletionStatus["personalityTests"]["status"],
    string
  > = {
    NONE: "No completed tests",
    SHORT_ONLY: "Short test only",
    LONG_ONLY: "Long test only",
    BOTH: "Both tests",
  };

  return (
    <>
      <section className="card overflow-hidden">
        <div className="border-b border-black/6 bg-[#fafbf8] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e5f2ed] text-[#27775f]">
                <Users size={22} />
              </span>
              <h2 className="mt-4 font-[var(--font-display)] text-2xl font-extrabold">
                Manage users
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#71807b]">
                Filter by completed personality tests, then select a user to see
                their full test and taste status.
              </p>
            </div>
            <span className="self-start rounded-full bg-[#eaf4f0] px-3 py-1.5 text-xs font-extrabold text-[#27775f] sm:self-auto">
              {users.length} {users.length === 1 ? "user" : "users"}
            </span>
          </div>
          <div
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Filter users by completed test"
          >
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                disabled={filter.value !== "ALL" && filter.count === undefined}
                onClick={() => setTestFilter(filter.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold transition-colors disabled:cursor-wait disabled:opacity-60 ${
                  testFilter === filter.value
                    ? "border-[#174f3f] bg-[#174f3f] text-white"
                    : "border-black/8 bg-white text-[#596762] hover:border-[#9ab8ad] hover:bg-[#f2f7f4]"
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    testFilter === filter.value ? "bg-white/18" : "bg-[#edf1ee]"
                  }`}
                >
                  {filter.count ?? "…"}
                </span>
              </button>
            ))}
          </div>
          <label className="relative mt-4 block">
            <span className="sr-only">Search users</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8c9793]"
            />
            <input
              type="search"
              className="input !pl-11"
              placeholder="Search by name, email or user ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="max-h-[31rem] overflow-y-auto p-2 sm:p-3">
          {filteredUsers.map((user) => {
            const name = user.displayName?.trim() || "Unnamed user";
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelected(user)}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#f1f6f3] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#27775f] sm:px-4"
                aria-label={`View completion details for ${name}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e6f2ed] text-sm font-black uppercase text-[#27775f]">
                  {name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-[#26332f]">
                    {name}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-[#8a9591] sm:text-xs">
                    {user.email || user.id}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-[#27775f] transition-colors group-hover:bg-[#e4f1ec]">
                  <ClipboardCheck size={16} />
                  <span className="hidden sm:inline">View status</span>
                </span>
              </button>
            );
          })}
          {!filteredUsers.length && (
            <div className="grid min-h-48 place-items-center px-6 text-center">
              <div>
                <Users className="mx-auto text-[#a3aca8]" size={28} />
                <p className="mt-3 text-sm font-bold text-[#56635f]">
                  {sourceUsers.length
                    ? "No users match your search"
                    : "No users found for this filter"}
                </p>
                {(search || testFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setTestFilter("ALL");
                    }}
                    className="mt-2 text-xs font-bold text-[#27775f] hover:text-[#174f3f]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {filteredUsers.length > 0 && (
          <p className="border-t border-black/6 bg-[#fafbf8] px-5 py-3 text-[11px] text-[#87928e]">
            Showing {filteredUsers.length} of {sourceUsers.length} for this filter.
          </p>
        )}
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#101c18]/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-status-title"
            className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e5f2ed] text-[#27775f]">
                <ClipboardCheck size={22} />
              </span>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setSelected(null)}
                className="grid size-9 place-items-center rounded-xl text-[#77837f] hover:bg-[#f2f4f1]"
                aria-label="Close user details"
              >
                <X size={18} />
              </button>
            </div>
            <h2
              id="user-status-title"
              className="mt-5 font-[var(--font-display)] text-2xl font-extrabold"
            >
              {selected.displayName?.trim() || "Unnamed user"}
            </h2>
            {selected.email && (
              <p className="mt-1 text-sm text-[#67746f]">{selected.email}</p>
            )}
            <div className="mt-4 rounded-xl bg-[#f5f6f3] px-4 py-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a9591]">
                User ID
              </p>
              <p className="mt-1 break-all font-mono text-xs text-[#52605c]">
                {selected.id}
              </p>
            </div>

            <div className="mt-6">
              {completionLoading ? (
                <div className="grid min-h-48 place-items-center text-sm font-bold text-[#71807b]">
                  <span className="flex items-center gap-2">
                    <LoaderCircle size={18} className="animate-spin" />
                    Loading completion status…
                  </span>
                </div>
              ) : completionError ? (
                <div className="rounded-xl border border-[#efc5ba] bg-[#fff3ef] p-4 text-sm text-[#984631]">
                  Could not load completion status: {completionError}
                </div>
              ) : completion ? (
                <div className="space-y-5">
                  <section>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-extrabold text-[#26332f]">
                        Personality tests
                      </h3>
                      <span className="rounded-full bg-[#eaf4f0] px-3 py-1 text-[11px] font-extrabold text-[#27775f]">
                        {statusLabels[completion.personalityTests.status]}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Short test", completion.personalityTests.completedShort],
                        ["Long test", completion.personalityTests.completedLong],
                      ].map(([label, complete]) => (
                        <div
                          key={String(label)}
                          className="flex items-center gap-3 rounded-xl border border-black/7 p-4"
                        >
                          {complete ? (
                            <CheckCircle2 size={20} className="text-[#27775f]" />
                          ) : (
                            <Circle size={20} className="text-[#a7b0ac]" />
                          )}
                          <div>
                            <p className="text-sm font-extrabold">{String(label)}</p>
                            <p className="mt-0.5 text-xs text-[#7c8884]">
                              {complete ? "Completed" : "Not completed"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-extrabold text-[#26332f]">
                        Taste selections
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                          completion.tastes.selected
                            ? "bg-[#eaf4f0] text-[#27775f]"
                            : "bg-[#f0f2ef] text-[#7c8884]"
                        }`}
                      >
                        {completion.tastes.selected ? "Selected" : "None selected"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {[
                        ["Music genres", completion.tastes.counts.musicGenres, Music],
                        ["Artists", completion.tastes.counts.favoriteArtists, Music],
                        ["Movie genres", completion.tastes.counts.movieGenres, Film],
                        ["Movies", completion.tastes.counts.favoriteMovies, Film],
                        ["Imported", completion.tastes.counts.importedItems, Activity],
                      ].map(([label, count, Icon]) => {
                        const CountIcon = Icon as typeof Music;
                        return (
                          <div key={String(label)} className="rounded-xl bg-[#f5f7f4] p-3">
                            <CountIcon size={16} className="text-[#74827d]" />
                            <p className="mt-3 text-xl font-black text-[#26332f]">
                              {String(count)}
                            </p>
                            <p className="mt-0.5 text-[10px] font-bold leading-4 text-[#7c8884]">
                              {String(label)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              ) : null}
            </div>

            <div className="mt-6 border-t border-black/7 pt-5">
              {confirmDelete ? (
                <div className="rounded-xl border border-[#efc5ba] bg-[#fff3ef] p-4">
                  <p className="text-sm font-extrabold text-[#8f3d2b]">
                    Permanently delete this user?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#9a5b4d]">
                    Their account and all related data will be deleted. This cannot
                    be undone.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                      className="btn-secondary"
                    >
                      Keep user
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={deleteUser}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b94e39] px-5 py-3 text-sm font-bold text-white hover:bg-[#9f3f2d] disabled:opacity-60"
                    >
                      {deleting ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      {deleting ? "Deleting…" : "Yes, delete user"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[#a74b37] hover:bg-[#fff0eb]"
                  >
                    <Trash2 size={16} /> Delete user
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
