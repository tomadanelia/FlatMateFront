import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GripHorizontal, MessageCircle, Move, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMessaging } from "../context/MessagingContext";
import type { Conversation, MessageParticipant } from "../types";

type Point = { x: number; y: number };

function participant(conversation: Conversation, userId: string) {
  return conversation.participantOneId === userId
    ? conversation.participantTwo
    : conversation.participantOne;
}

function Avatar({ person }: { person: MessageParticipant }) {
  const label = (person.displayName || "FlatMate member")
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return person.avatarUrl ? (
    <img src={person.avatarUrl} className="size-10 rounded-full object-cover" alt="" />
  ) : (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dceee7] text-xs font-black text-[#174f3f]">{label}</span>
  );
}

export function ChatDock() {
  const { user } = useAuth();
  const { conversations, unreadCount, connected } = useMessaging();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const drag = useRef<{ start: Point; origin: Point; moved: boolean } | null>(null);

  useEffect(() => {
    function fit() {
      if (window.innerWidth < 768) return;
      setPosition((current) => {
        const width = open ? 360 : 64;
        const height = open ? 500 : 64;
        const fallback = { x: window.innerWidth - width - 24, y: window.innerHeight - height - 24 };
        if (!current) return fallback;
        return {
          x: Math.max(12, Math.min(current.x, window.innerWidth - width - 12)),
          y: Math.max(12, Math.min(current.y, window.innerHeight - height - 12)),
        };
      });
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open]);

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (window.innerWidth < 768 || !position) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      start: { x: event.clientX, y: event.clientY },
      origin: position,
      moved: false,
    };
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!drag.current || window.innerWidth < 768) return;
    const dx = event.clientX - drag.current.start.x;
    const dy = event.clientY - drag.current.start.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.current.moved = true;
    const width = open ? 360 : 64;
    const height = open ? 500 : 64;
    setPosition({
      x: Math.max(12, Math.min(drag.current.origin.x + dx, window.innerWidth - width - 12)),
      y: Math.max(12, Math.min(drag.current.origin.y + dy, window.innerHeight - height - 12)),
    });
  }

  function finishDrag() {
    const moved = drag.current?.moved;
    drag.current = null;
    return moved;
  }

  if (!user) return null;
  const desktopStyle = position ? { left: position.x, top: position.y } : undefined;

  if (!open) {
    return (
      <button
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={() => { if (!finishDrag()) setOpen(true); }}
        onPointerCancel={() => { drag.current = null; }}
        style={desktopStyle}
        className="fixed bottom-5 right-5 z-50 grid size-15 touch-none place-items-center rounded-2xl bg-[#174f3f] text-white shadow-[0_16px_40px_rgba(23,79,63,.3)] hover:-translate-y-1 hover:bg-[#103e31] md:bottom-auto md:right-auto"
        aria-label="Open messages. Drag to move."
        title="Messages — drag to move"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && <span className="absolute -right-2 -top-2 grid min-w-6 place-items-center rounded-full border-2 border-white bg-[#f18b6d] px-1.5 py-0.5 text-[10px] font-black">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
    );
  }

  return (
    <section
      style={desktopStyle}
      className="fixed inset-x-3 bottom-3 z-50 flex h-[min(560px,calc(100vh-24px))] flex-col overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(24,42,36,.24)] md:inset-auto md:h-[500px] md:w-[360px]"
      aria-label="Quick messages"
    >
      <header
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={() => { drag.current = null; }}
        className="flex touch-none select-none items-center gap-3 bg-[#174f3f] px-4 py-3.5 text-white md:cursor-move"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-white/12"><MessageCircle size={18} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h2 className="text-sm font-black">Quick messages</h2><span className={`size-1.5 rounded-full ${connected ? "bg-[#71dbad]" : "animate-pulse bg-[#f3c568]"}`} /></div>
          <p className="text-[10px] font-semibold text-white/65">Drag this header to move</p>
        </div>
        <GripHorizontal size={18} className="hidden text-white/45 md:block" />
        <button onPointerDown={(event) => event.stopPropagation()} onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-white/12" aria-label="Close quick messages"><X size={18} /></button>
      </header>
      <div className="flex items-center justify-between border-b border-black/6 px-4 py-3">
        <p className="text-xs font-extrabold text-[#5b6864]">Recent conversations</p>
        <button onClick={() => { setOpen(false); navigate("/app/messages"); }} className="text-xs font-black text-[#27775f] hover:text-[#174f3f]">Open inbox</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length ? conversations.slice(0, 8).map((conversation) => {
          const person = participant(conversation, user.id);
          const message = conversation.messages?.[0];
          const unread = conversation._count?.messages || 0;
          return (
            <button key={conversation.id} onClick={() => { setOpen(false); navigate(`/app/messages/${conversation.id}`); }} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-[#f2f6f3]">
              <Avatar person={person} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{person.displayName || "FlatMate member"}</p>
                <p className={`mt-0.5 truncate text-xs ${unread ? "font-bold text-[#4c5a55]" : "text-[#89958f]"}`}>{message?.body || "Start the conversation"}</p>
              </div>
              {unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-[#f18b6d] px-1.5 py-0.5 text-[10px] font-black text-white">{unread}</span>}
            </button>
          );
        }) : (
          <div className="grid h-full place-items-center px-8 text-center">
            <div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e7f2ed] text-[#27775f]"><Move size={20} /></span><p className="mt-4 text-sm font-extrabold">No conversations yet</p><p className="mt-1 text-xs leading-5 text-[#87938e]">Find someone compatible and send the first message.</p><button onClick={() => { setOpen(false); navigate("/app/discover"); }} className="mt-4 rounded-xl bg-[#174f3f] px-4 py-2.5 text-xs font-black text-white">Discover people</button></div>
          </div>
        )}
      </div>
    </section>
  );
}
