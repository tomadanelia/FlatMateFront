import { Link } from "react-router-dom";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 font-[var(--font-display)] text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-[#173b31]"}`}
    >
      <span
        className={`grid size-9 place-items-center rounded-[11px] ${light ? "bg-white text-[#174f3f]" : "bg-[#174f3f] text-white"}`}
      >
        <svg
          viewBox="0 0 32 32"
          className="size-5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 15.1 16 6l11 9.1v10.4a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 5 25.5V15.1Z"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 27v-8h8v8M10 12.5c2.8 2.5 9.2 2.5 12 0"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      Flatmate
    </Link>
  );
}
