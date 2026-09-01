import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type SelectHTMLAttributes,
} from "react";

type Option = { value: string; label: string };

function useDesktop() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return desktop;
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return ref;
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value: string) {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date)
    : "Choose your birth date";
}

const months = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat(undefined, { month: "short" }).format(
    new Date(2024, month, 1),
  ),
);

type DatePickerProps = {
  value?: string;
  defaultValue?: string;
  name?: string;
  onChange?: (value: string) => void;
  nativeClassName?: string;
  nativeWithIcon?: boolean;
};

export function ModernDatePicker({
  value,
  defaultValue = "",
  name,
  onChange,
  nativeClassName = "input picker-input pr-12 font-semibold",
  nativeWithIcon = true,
}: DatePickerProps) {
  const desktop = useDesktop();
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = controlled ? value : internalValue;

  if (!desktop) {
    const input = (
      <input
        name={name}
        className={nativeClassName}
        type="date"
        value={controlled ? value : undefined}
        defaultValue={controlled ? undefined : defaultValue}
        onClick={(event) => event.currentTarget.showPicker?.()}
        onChange={(event) => {
          if (!controlled) setInternalValue(event.target.value);
          onChange?.(event.target.value);
        }}
      />
    );
    if (!nativeWithIcon) return input;
    return (
      <div className="group relative">
        {input}
        <CalendarDays
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#648079] transition-colors group-focus-within:text-[#27775f]"
          size={18}
        />
      </div>
    );
  }

  return (
    <DesktopDatePicker
      name={name}
      value={currentValue}
      onChange={(nextValue) => {
        if (!controlled) setInternalValue(nextValue);
        onChange?.(nextValue);
      }}
    />
  );
}

function DesktopDatePicker({
  name,
  value,
  onChange,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const [view, setView] = useState(
    () => selected || new Date(new Date().getFullYear() - 25, 0, 1),
  );
  const [yearMode, setYearMode] = useState(false);
  const popoverId = useId();
  const close = () => {
    setOpen(false);
    setYearMode(false);
  };
  const ref = useDismiss(open, close);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: total }, (_, index) =>
        new Date(year, month, index + 1),
      ),
    ];
  }, [view]);

  const decadeStart = Math.floor(view.getFullYear() / 12) * 12;

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        className="input picker-input flex min-h-12 cursor-pointer items-center justify-between pr-4 text-left font-semibold"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? "text-[#17221f]" : "text-[#98a19e]"}>
          {displayDate(value)}
        </span>
        <CalendarDays size={18} className="shrink-0 text-[#648079]" />
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Choose date of birth"
          className="absolute left-0 top-[calc(100%+10px)] z-40 w-[320px] rounded-2xl border border-[#dbe4df] bg-white p-4 shadow-[0_20px_55px_rgba(23,79,63,.18)]"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label={yearMode ? "Previous years" : "Previous month"}
              className="grid size-9 cursor-pointer place-items-center rounded-xl text-[#60716b] hover:bg-[#edf5f1] hover:text-[#174f3f]"
              onClick={() =>
                setView(
                  new Date(
                    view.getFullYear() - (yearMode ? 12 : 0),
                    view.getMonth() - (yearMode ? 0 : 1),
                    1,
                  ),
                )
              }
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-extrabold hover:bg-[#edf5f1] hover:text-[#174f3f]"
              onClick={() => setYearMode((current) => !current)}
            >
              {yearMode
                ? `${decadeStart} – ${decadeStart + 11}`
                : new Intl.DateTimeFormat(undefined, {
                    month: "long",
                    year: "numeric",
                  }).format(view)}
            </button>
            <button
              type="button"
              aria-label={yearMode ? "Next years" : "Next month"}
              className="grid size-9 cursor-pointer place-items-center rounded-xl text-[#60716b] hover:bg-[#edf5f1] hover:text-[#174f3f]"
              onClick={() =>
                setView(
                  new Date(
                    view.getFullYear() + (yearMode ? 12 : 0),
                    view.getMonth() + (yearMode ? 0 : 1),
                    1,
                  ),
                )
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {yearMode ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, index) => decadeStart + index).map(
                (year) => (
                  <button
                    type="button"
                    key={year}
                    disabled={year > today.getFullYear()}
                    className={`cursor-pointer rounded-xl py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${year === view.getFullYear() ? "bg-[#174f3f] text-white" : "bg-[#f5f8f6] hover:bg-[#dff1ea] hover:text-[#174f3f]"}`}
                    onClick={() => {
                      setView(new Date(year, view.getMonth(), 1));
                      setYearMode(false);
                    }}
                  >
                    {year}
                  </button>
                ),
              )}
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-extrabold uppercase tracking-wide text-[#8a9893]">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                  <span key={day} className="py-2">{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (!day) return <span key={`empty-${index}`} />;
                  const dayValue = dateValue(day);
                  const isSelected = dayValue === value;
                  const disabled = day > today;
                  return (
                    <button
                      type="button"
                      key={dayValue}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      className={`grid aspect-square cursor-pointer place-items-center rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:text-[#c8cfcc] ${isSelected ? "bg-[#174f3f] text-white shadow-sm" : "hover:bg-[#dff1ea] hover:text-[#174f3f]"}`}
                      onClick={() => {
                        onChange(dayValue);
                        close();
                      }}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 border-t border-[#edf0ed] pt-3">
                {months.map((month, index) => (
                  <button
                    type="button"
                    key={month}
                    disabled={
                      view.getFullYear() === today.getFullYear() &&
                      index > today.getMonth()
                    }
                    className={`cursor-pointer rounded-lg py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-30 ${index === view.getMonth() ? "bg-[#dff1ea] text-[#174f3f]" : "text-[#687772] hover:bg-[#f1f5f3]"}`}
                    onClick={() => setView(new Date(view.getFullYear(), index, 1))}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

type ModernSelectProps = {
  options: Option[];
  value?: string;
  defaultValue?: string;
  name?: string;
  onChange?: (value: string) => void;
  nativeClassName?: string;
  nativeWithIcon?: boolean;
} & Pick<SelectHTMLAttributes<HTMLSelectElement>, "required">;

export function ModernSelect({
  options,
  value,
  defaultValue = "",
  name,
  onChange,
  required,
  nativeClassName = "input picker-input appearance-none pr-12 font-semibold",
  nativeWithIcon = true,
}: ModernSelectProps) {
  const desktop = useDesktop();
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = controlled ? value : internalValue;
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useDismiss(open, close);
  const listboxId = useId();

  if (!desktop) {
    const select = (
      <select
        name={name}
        className={nativeClassName}
        required={required}
        value={controlled ? value : undefined}
        defaultValue={controlled ? undefined : defaultValue}
        onChange={(event) => {
          if (!controlled) setInternalValue(event.target.value);
          onChange?.(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
    if (!nativeWithIcon) return select;
    return (
      <div className="group relative">
        {select}
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#648079] transition-colors group-focus-within:text-[#27775f]"
          size={18}
        />
      </div>
    );
  }

  const selectedOption = options.find((option) => option.value === currentValue);
  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={currentValue} />}
      <button
        type="button"
        className="input picker-input flex min-h-12 cursor-pointer items-center justify-between pr-4 text-left font-semibold"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={currentValue ? "text-[#17221f]" : "text-[#98a19e]"}>
          {selectedOption?.label || "Choose an option"}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#648079] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-2xl border border-[#dbe4df] bg-white p-1.5 shadow-[0_20px_55px_rgba(23,79,63,.18)]"
        >
          {options.map((option) => {
            const selected = option.value === currentValue;
            return (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                key={option.value}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-colors ${selected ? "bg-[#e4f2ec] text-[#174f3f]" : "text-[#3b4944] hover:bg-[#f1f6f3]"}`}
                onClick={() => {
                  if (!controlled) setInternalValue(option.value);
                  onChange?.(option.value);
                  close();
                }}
              >
                {option.label}
                {selected && <Check size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
