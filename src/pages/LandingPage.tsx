import {
  ArrowRight,
  BadgeCheck,
  Heart,
  KeyRound,
  MapPin,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoUrl from "../logo/logo.svg";

export function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app/discover" replace />;
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f6f0]">
      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
        <Link to="/" aria-label="Flatmate home" className="shrink-0">
          <img
            src={logoUrl}
            alt="Flatmate"
            className="size-[72px] rounded-xl object-contain"
          />
        </Link>
        <nav className="ml-auto hidden items-center gap-8 text-sm font-bold text-[#53605c] md:flex">
          <a href="#how">How it works</a>
          <a href="#why">Why Flatmate</a>
          <Link to="/auth">Log in</Link>
        </nav>
        <Link to="/auth?mode=signup" className="btn-primary ml-5 !px-4 !py-2.5">
          Find my flatmate <ArrowRight size={16} />
        </Link>
      </header>
      <main>
        <section className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-0">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b8d9cd] bg-[#e9f5f0] px-3.5 py-2 text-xs font-extrabold text-[#21644f]">
              <Sparkles size={14} /> Roommate matching that goes deeper
            </div>
            <h1 className="font-[var(--font-display)] text-[clamp(3.2rem,7vw,6.5rem)] font-extrabold leading-[.9] tracking-[-.07em] text-[#172b25]">
              Find your
              <br />
              <span className="relative text-[#27775f]">people.</span>
              <br />
              Feel at home.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#65736f]">
              Match with roommates based on the things that actually matter: how
              you live, what you love, and the kind of home you want to build.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/auth?mode=signup"
                className="btn-primary !px-6 !py-3.5"
              >
                Start matching for free <ArrowRight size={18} />
              </Link>
              <a href="#how" className="btn-secondary !bg-transparent">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["#f4c46d", "#90cdb9", "#e9987f", "#8197cc"].map(
                  (color, i) => (
                    <span
                      key={i}
                      style={{ backgroundColor: color }}
                      className="grid size-9 place-items-center rounded-full border-2 border-[#f7f6f0] text-[10px] font-black"
                    >
                      {["M", "JL", "A", "K"][i]}
                    </span>
                  ),
                )}
              </div>
              <div>
                <div className="flex text-[#e7ac3f]">★★★★★</div>
                <p className="text-xs font-semibold text-[#687570]">
                  Loved by 2,000+ happy flatmates
                </p>
              </div>
            </div>
          </div>
          <div className="relative mx-auto h-[550px] w-full max-w-[520px]">
            <div className="absolute inset-10 rotate-3 rounded-[42px] bg-[#d8eee5]" />
            <div className="absolute right-5 top-5 h-[470px] w-[77%] overflow-hidden rounded-[36px] bg-[#214e42] shadow-[0_30px_80px_rgba(35,73,62,.23)]">
              <div className="absolute inset-0 soft-grid opacity-20" />
              <div className="absolute left-0 right-0 top-0 h-2/3 bg-[radial-gradient(circle_at_45%_25%,#8bc8b3_0,#397866_32%,transparent_70%)]" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur">
                  Top match
                </span>
                <h3 className="mt-4 font-[var(--font-display)] text-3xl font-extrabold">
                  Maya, 26
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                  <MapPin size={14} /> Vake, Tbilisi
                </p>
                <div className="mt-5 flex gap-2">
                  <span className="rounded-lg bg-white/12 px-2.5 py-1.5 text-xs">
                    Early bird
                  </span>
                  <span className="rounded-lg bg-white/12 px-2.5 py-1.5 text-xs">
                    Pet friendly
                  </span>
                </div>
              </div>
              <div className="absolute left-1/2 top-[28%] grid size-36 -translate-x-1/2 place-items-center rounded-full border-8 border-white/15 bg-[#f0c56c] text-5xl">
                ☀️
              </div>
            </div>
            <div className="float-card absolute bottom-8 left-0 w-60 rounded-2xl bg-white p-4 shadow-[0_18px_45px_rgba(33,54,47,.18)]">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-[#d8f2e7] text-[#174f3f]">
                  <Heart fill="currentColor" size={19} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#84908c]">
                    Compatibility
                  </p>
                  <p className="font-[var(--font-display)] text-2xl font-black text-[#174f3f]">
                    94% match
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0ec]">
                <div className="h-full w-[94%] rounded-full bg-[#4aa989]" />
              </div>
            </div>
            <span className="absolute left-1 top-14 text-3xl text-[#e6ad42]">
              ✦
            </span>
            <span className="absolute right-0 top-0 text-4xl text-[#e68568]">
              ✦
            </span>
          </div>
        </section>
        <section id="how" className="bg-white py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="text-center">
              <p className="eyebrow">Simple by design</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl font-extrabold tracking-tight">
                A better match in three steps
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[#71807b]">
                No endless swiping. Just meaningful compatibility, explained
                clearly.
              </p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                [
                  MessageCircleHeart,
                  "Tell us how you live",
                  "Build a thoughtful profile around your budget, routines and boundaries.",
                ],
                [
                  Sparkles,
                  "Reveal your compatibility",
                  "A short assessment and your favorite things help us understand your vibe.",
                ],
                [
                  BadgeCheck,
                  "Meet your best matches",
                  "See exactly why you click, then choose who you want to get to know.",
                ],
              ].map(([Icon, title, body], i) => {
                const I = Icon as typeof Sparkles;
                return (
                  <div
                    key={String(title)}
                    className="rounded-3xl border border-black/6 bg-[#fafbf8] p-7"
                  >
                    <span className="mb-8 flex items-start justify-between">
                      <span className="grid size-12 place-items-center rounded-2xl bg-[#dff1ea] text-[#21644f]">
                        <I size={23} />
                      </span>
                      <span className="font-[var(--font-display)] text-4xl font-black text-[#e1e6e2]">
                        0{i + 1}
                      </span>
                    </span>
                    <h3 className="font-[var(--font-display)] text-xl font-extrabold">
                      {String(title)}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#71807b]">
                      {String(body)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section
          id="why"
          className="relative overflow-hidden bg-[#174f3f] py-24 text-white noise"
        >
          <div className="relative z-10 mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#9ed5c2]">
                Home should feel easy
              </p>
              <h2 className="mt-4 font-[var(--font-display)] text-4xl font-extrabold leading-tight">
                Compatibility you can actually understand.
              </h2>
              <p className="mt-5 leading-7 text-white/65">
                Our matching looks at personality, lifestyle and taste — then
                shows you the full picture, with no mystery scores.
              </p>
              <Link
                to="/auth?mode=signup"
                className="mt-8 inline-flex items-center gap-2 font-bold text-[#f1cc75]"
              >
                Find your people <ArrowRight size={17} />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [ShieldCheck, "Private by default"],
                [KeyRound, "Your boundaries matter"],
                [Heart, "Humans, not profiles"],
                [Sparkles, "Transparent matching"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Sparkles;
                return (
                  <div
                    key={String(label)}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
                  >
                    <I className="text-[#f2c66d]" size={20} />
                    <span className="text-sm font-bold">{String(label)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#102f27] px-5 py-8 text-white/55">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link to="/" aria-label="Flatmate home">
            <img
              src={logoUrl}
              alt="Flatmate"
              className="size-16 rounded-xl object-contain"
            />
          </Link>
          <p className="text-xs">
            © {new Date().getFullYear()} Flatmate. Better living starts with
            better company.
          </p>
        </div>
      </footer>
    </div>
  );
}
