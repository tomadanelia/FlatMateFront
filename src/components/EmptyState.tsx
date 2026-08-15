import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: React.ReactNode }) {
  return <div className="card flex min-h-72 flex-col items-center justify-center p-8 text-center"><span className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#e9f5f0] text-[#27775f]"><Icon size={25}/></span><h3 className="font-[var(--font-display)] text-xl font-extrabold">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#71807b]">{body}</p>{action && <div className="mt-5">{action}</div>}</div>
}
