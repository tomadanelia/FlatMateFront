import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { api, friendlyError } from "../lib/api";
import type { Submission, TestDefinition } from "../types";

export function TestPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestDefinition | null | undefined>();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Submission | null>(null);
  useEffect(() => {
    if (slug)
      api
        .getTest(slug)
        .then(setTest)
        .catch((e) => {
          toast.error(friendlyError(e));
          setTest(null);
        });
  }, [slug]);
  const questions = useMemo(
    () =>
      test ? [...test.questions].sort((a, b) => a.position - b.position) : [],
    [test],
  );
  if (test === undefined) return <Loading label="Preparing your assessment…" />;
  if (!test)
    return (
      <div className="card p-10 text-center">
        <h1 className="text-2xl font-black">Assessment not found</h1>
        <Link to="/app/assessments" className="btn-primary mt-5">
          Back to assessments
        </Link>
      </div>
    );
  if (result)
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#dff1ea] text-[#27775f]">
          <PartyPopper size={34} />
        </span>
        <p className="eyebrow mt-7">Assessment complete</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-extrabold">
          You’ve given your matches more meaning.
        </h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-[#71807b]">
          Your traits have been scored and will now contribute to personality
          compatibility.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {result.traitScores.map((t) => (
            <div
              key={t.id}
              className="card flex items-center justify-between p-4"
            >
              <span className="text-sm font-bold capitalize">
                {t.trait.replace(/_/g, " ")}
              </span>
              <span className="text-lg font-black text-[#27775f]">
                {Math.round(t.score * 100)}%
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate("/app/discover")}
          className="btn-primary mt-8"
        >
          See updated matches <ArrowRight size={17} />
        </button>
      </div>
    );
  const question = questions[index];
  if (!question)
    return (
      <div className="card p-10 text-center">
        This assessment has no questions yet.
      </div>
    );
  const value = answers[question.id];
  async function advance() {
    if (value === undefined) {
      toast.error("Choose an answer to continue");
      return;
    }
    if (index < questions.length - 1) {
      setIndex(index + 1);
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const submission = await api.submitTest({
        userId: user.id,
        testDefinitionId: test!.id,
        answers: questions.map((q) => ({
          questionId: q.id,
          value: answers[q.id],
        })),
      });
      setResult(submission);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/app/assessments"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#71807b]"
      >
        <ArrowLeft size={16} /> Exit assessment
      </Link>
      <div className="mt-8 flex items-center justify-between">
        <div>
          <p className="eyebrow">{test.name}</p>
          <p className="mt-1 text-sm font-bold">
            Question {index + 1} of {questions.length}
          </p>
        </div>
        <span className="text-sm font-black text-[#27775f]">
          {Math.round(((index + 1) / questions.length) * 100)}%
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e1e4df]">
        <div
          className="h-full rounded-full bg-[#27775f] transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>
      <section className="card mt-7 p-6 sm:p-10">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#98a19e]">
          Reflect honestly
        </span>
        <h1 className="mt-4 font-[var(--font-display)] text-2xl font-extrabold leading-snug sm:text-3xl">
          {question.prompt}
        </h1>
        <div className="mt-8 grid gap-3 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setAnswers({ ...answers, [question.id]: v })}
              className={`relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border text-center ${value === v ? "border-[#27775f] bg-[#eaf5f1] text-[#174f3f] shadow-sm" : "border-black/8 bg-white text-[#64716d] hover:border-[#91b8aa]"}`}
            >
              <span className="text-xl font-black">{v}</span>
              <span className="text-[10px] font-bold">
                {
                  [
                    "Strongly disagree",
                    "Disagree",
                    "Neutral",
                    "Agree",
                    "Strongly agree",
                  ][v - 1]
                }
              </span>
              {value === v && (
                <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-[#27775f] text-white">
                  <Check size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
      <div className="mt-6 flex justify-between">
        <button
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className="btn-secondary disabled:invisible"
        >
          <ArrowLeft size={17} /> Previous
        </button>
        <button
          disabled={loading || value === undefined}
          onClick={advance}
          className="btn-primary"
        >
          {loading
            ? "Scoring…"
            : index === questions.length - 1
              ? "Finish assessment"
              : "Next question"}{" "}
          {!loading && <ArrowRight size={17} />}
        </button>
      </div>
    </div>
  );
}
