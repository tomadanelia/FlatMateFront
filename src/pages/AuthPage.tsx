import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Heart,
  Sparkles,
} from "lucide-react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";
import { Brand } from "../components/Brand";
import { VerificationCodeModal } from "../components/VerificationCodeModal";
import { ApiError, api, friendlyError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const PENDING_VERIFICATION_KEY = "flatmate_pending_verification";

type PendingVerification = {
  email: string;
  destination: string;
  resendAvailableAt: number;
};

function loadPendingVerification(): PendingVerification | null {
  try {
    return JSON.parse(
      sessionStorage.getItem(PENDING_VERIFICATION_KEY) || "null",
    );
  } catch {
    return null;
  }
}

export function AuthPage() {
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerificationState] =
    useState<PendingVerification | null>(loadPendingVerification);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  useEffect(
    () => setParams(signup ? { mode: "signup" } : {}, { replace: true }),
    [signup, setParams],
  );
  if (user) return <Navigate to="/app/discover" replace />;
  const strong =
    /[a-z]/.test(form.password) &&
    /[A-Z]/.test(form.password) &&
    /\d/.test(form.password) &&
    form.password.length >= 8;

  function setPendingVerification(next: PendingVerification | null) {
    if (next) {
      sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
    }
    setPendingVerificationState(next);
  }

  function openVerification(email: string, destination: string) {
    setPendingVerification({
      email: email.trim().toLowerCase(),
      destination,
      resendAvailableAt: Date.now() + 60_000,
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (signup) {
        await api.signup(form);
        openVerification(form.email, "/onboarding");
        toast.success("Account created. Check your email for the code.");
      } else {
        const result = await api.login({
          email: form.email,
          password: form.password,
        });
        setSession(result);
        toast.success("Welcome back!");
        navigate(
          (location.state as { from?: string })?.from || "/app/discover",
        );
      }
    } catch (err) {
      if (
        !signup &&
        err instanceof ApiError &&
        err.status === 403 &&
        err.message.toLowerCase().includes("email verification is required")
      ) {
        openVerification(
          form.email,
          (location.state as { from?: string })?.from || "/app/discover",
        );
        toast.info("Verify your email to continue.");
      } else {
        toast.error(friendlyError(err));
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[.92fr_1.08fr]">
      <div className="relative hidden overflow-hidden bg-[#174f3f] p-12 text-white lg:flex lg:flex-col noise">
        <div className="relative z-10">
          <Brand light />
        </div>
        <div className="relative z-10 my-auto max-w-lg">
          <span className="mb-7 grid size-14 place-items-center rounded-2xl bg-white/10">
            <Heart className="text-[#f3c568]" fill="currentColor" />
          </span>
          <blockquote className="font-[var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight">
            “Home became my favorite place when I found the right person to
            share it with.”
          </blockquote>
          <div className="mt-8 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#efad7a] font-black text-[#57331b]">
              LN
            </span>
            <div>
              <p className="text-sm font-bold">Lea & Nino</p>
              <p className="text-xs text-white/55">Flatmates since 2025</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex gap-6 text-xs font-semibold text-white/50">
          <span className="flex items-center gap-1.5">
            <Check size={14} /> Meaningful matches
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={14} /> Always transparent
          </span>
        </div>
        <div className="absolute -right-32 -top-28 size-[450px] rounded-full border border-white/8" />
        <div className="absolute -right-10 -top-10 size-[300px] rounded-full border border-white/8" />
        <Sparkles
          className="absolute bottom-20 right-20 text-[#f1c467]"
          size={44}
        />
      </div>
      <div className="flex min-h-screen flex-col p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold text-[#65736f] hover:text-[#174f3f]"
          >
            <ArrowLeft size={17} /> Back home
          </Link>
          <div className="lg:hidden">
            <Brand />
          </div>
        </div>
        <div className="mx-auto my-auto w-full max-w-[440px] py-12">
          <p className="eyebrow">
            {signup ? "Your next chapter" : "Good to see you"}
          </p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl font-extrabold tracking-tight">
            {signup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#71807b]">
            {signup
              ? "Start with the basics. Your perfect flatmate could be closer than you think."
              : "Pick up where you left off and see who’s new."}
          </p>
          <div className="mt-7 grid grid-cols-2 rounded-xl bg-[#f1f3ef] p-1">
            <button
              onClick={() => setSignup(false)}
              className={`rounded-lg py-2.5 text-sm font-bold ${!signup ? "bg-white text-[#174f3f] shadow-sm" : "text-[#7a8782]"}`}
            >
              Log in
            </button>
            <button
              onClick={() => setSignup(true)}
              className={`rounded-lg py-2.5 text-sm font-bold ${signup ? "bg-white text-[#174f3f] shadow-sm" : "text-[#7a8782]"}`}
            >
              Sign up
            </button>
          </div>
          <form onSubmit={submit} className="mt-7 space-y-5">
            {signup && (
              <div>
                <label className="label">First name or nickname</label>
                <input
                  className="input"
                  required
                  minLength={1}
                  maxLength={80}
                  placeholder="How should we call you?"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                />
              </div>
            )}
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                required
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <div className="flex justify-between">
                <label className="label">Password</label>
                {!signup && (
                  <span className="text-xs font-semibold text-[#27775f]">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  className="input pr-12"
                  required
                  type={show ? "text" : "password"}
                  minLength={signup ? 8 : 1}
                  maxLength={72}
                  placeholder={signup ? "8+ characters" : "Your password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#89938f]"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signup && (
                <p
                  className={`mt-2 flex items-center gap-1.5 text-xs ${strong ? "text-[#27775f]" : "text-[#8b9692]"}`}
                >
                  <Check size={13} /> 8+ characters with uppercase, lowercase
                  and a number
                </p>
              )}
            </div>
            <button
              disabled={loading || (signup && !strong)}
              className="btn-primary w-full !py-3.5"
            >
              {loading
                ? "Please wait…"
                : signup
                  ? "Create my account"
                  : "Log in"}{" "}
              {!loading && <ArrowRight size={17} />}
            </button>
            <p className="text-center text-xs leading-5 text-[#8a9591]">
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </form>
        </div>
      </div>
      {pendingVerification && (
        <VerificationCodeModal
          email={pendingVerification.email}
          initialResendAvailableAt={pendingVerification.resendAvailableAt}
          onResendAvailableAtChange={(resendAvailableAt) =>
            setPendingVerification({
              ...pendingVerification,
              resendAvailableAt,
            })
          }
          onVerified={(session) => {
            const destination = pendingVerification.destination;
            setSession(session);
            setPendingVerification(null);
            toast.success("Email verified. Welcome to FlatMate!");
            navigate(destination);
          }}
          onUseDifferentEmail={() => {
            setPendingVerification(null);
            setForm((current) => ({ ...current, email: "", password: "" }));
          }}
        />
      )}
    </div>
  );
}
