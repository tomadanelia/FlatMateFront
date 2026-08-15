export function Loading({ label = "Loading your space…" }: { label?: string }) {
  return (
    <div className="grid min-h-[45vh] place-items-center">
      <div className="text-center">
        <span className="mx-auto mb-4 block size-9 animate-spin rounded-full border-3 border-[#d8e8e1] border-t-[#27775f]" />
        <p className="text-sm font-semibold text-[#71807b]">{label}</p>
      </div>
    </div>
  );
}
