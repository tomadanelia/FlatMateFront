import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { api, friendlyError } from "../lib/api";
import type { AuthResponse } from "../types";

type VerificationCodeModalProps = {
  email: string;
  initialResendAvailableAt: number;
  onResendAvailableAtChange: (timestamp: number) => void;
  onVerified: (session: AuthResponse) => void;
  onUseDifferentEmail: () => void;
};

const GENERIC_RESEND_MESSAGE =
  "If an account is waiting for verification, a new code has been sent.";

function secondsUntil(timestamp: number) {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

export function VerificationCodeModal({
  email,
  initialResendAvailableAt,
  onResendAvailableAtChange,
  onVerified,
  onUseDifferentEmail,
}: VerificationCodeModalProps) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [remaining, setRemaining] = useState(() =>
    secondsUntil(initialResendAvailableAt),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    setRemaining(secondsUntil(initialResendAvailableAt));
    const timer = window.setInterval(() => {
      setRemaining(secondsUntil(initialResendAvailableAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [initialResendAvailableAt]);

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6) {
      setError("Enter the complete six-digit code.");
      return;
    }

    setVerifying(true);
    setError("");
    try {
      const session = await api.verifyEmail({ email, code });
      onVerified(session);
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    if (remaining > 0 || resending) return;
    setResending(true);
    setError("");
    setConfirmation("");
    try {
      await api.resendVerification(email);
      const nextAvailableAt = Date.now() + 60_000;
      onResendAvailableAtChange(nextAvailableAt);
      setConfirmation(GENERIC_RESEND_MESSAGE);
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#0d2f26]/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(8,35,28,.3)] sm:p-8">
        <div className="absolute -right-16 -top-16 size-44 rounded-full bg-[#d8f2e7]/70" />
        <div className="relative">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#d8f2e7] text-[#174f3f]">
            <MailCheck size={27} />
          </span>
          <p className="eyebrow mt-6">One last step</p>
          <h2
            id="verification-title"
            className="mt-2 font-[var(--font-display)] text-3xl font-extrabold tracking-tight"
          >
            Check your inbox
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#71807b]">
            We sent a six-digit verification code to{" "}
            <strong className="break-all text-[#36443f]">{email}</strong>.
          </p>

          <form onSubmit={verify} className="mt-7">
            <label htmlFor="verification-code" className="label">
              Verification code
            </label>
            <input
              ref={inputRef}
              id="verification-code"
              className="input h-14 text-center font-mono text-2xl font-bold tracking-[.45em] tabular-nums"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              aria-describedby={error ? "verification-error" : undefined}
            />
            {error && (
              <p
                id="verification-error"
                role="alert"
                className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            {confirmation && (
              <p
                role="status"
                className="mt-3 rounded-xl bg-[#eef8f3] px-3 py-2 text-sm text-[#27775f]"
              >
                {confirmation}
              </p>
            )}
            <button
              className="btn-primary mt-5 w-full !py-3.5"
              disabled={verifying || code.length !== 6}
            >
              {verifying ? "Verifying…" : "Verify and continue"}
              {!verifying && <ShieldCheck size={17} />}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-[#71807b]">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={resend}
              disabled={remaining > 0 || resending}
              className="inline-flex items-center gap-1 font-bold text-[#27775f] disabled:text-[#9aa39f]"
            >
              <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
              {resending
                ? "Sending…"
                : remaining > 0
                  ? `Resend in ${remaining}s`
                  : "Resend code"}
            </button>
          </div>
          <button
            type="button"
            onClick={onUseDifferentEmail}
            className="mx-auto mt-6 flex items-center gap-1.5 text-xs font-bold text-[#71807b] hover:text-[#174f3f]"
          >
            <ArrowLeft size={14} /> Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}
