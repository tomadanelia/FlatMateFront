import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useMessaging } from "../context/MessagingContext";
import { friendlyError } from "../lib/api";
import type { ChatMessage, Conversation, MessageParticipant } from "../types";

const EMPTY_MESSAGES: ChatMessage[] = [];

function otherParticipant(conversation: Conversation, userId: string) {
  return conversation.participantOneId === userId
    ? conversation.participantTwo
    : conversation.participantOne;
}

function initials(person: MessageParticipant) {
  return (person.displayName || "Havenly member")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ person, size = "size-11" }: { person: MessageParticipant; size?: string }) {
  return person.avatarUrl ? (
    <img src={person.avatarUrl} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-[#dceee7] text-xs font-black text-[#174f3f]`}>
      {initials(person)}
    </span>
  );
}

function timeLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function ConversationRow({ conversation, active, userId, onClick }: {
  conversation: Conversation;
  active: boolean;
  userId: string;
  onClick: () => void;
}) {
  const person = otherParticipant(conversation, userId);
  const latest = conversation.messages?.[0];
  const unread = conversation._count?.messages || 0;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${active ? "bg-[#e8f3ee]" : "hover:bg-[#f5f6f2]"}`}
    >
      <div className="relative">
        <Avatar person={person} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-[#f18b6d]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-extrabold">{person.displayName || "Havenly member"}</span>
          {conversation.lastMessageAt && <time className="ml-auto shrink-0 text-[10px] font-semibold text-[#93a09b]">{timeLabel(conversation.lastMessageAt)}</time>}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p className={`truncate text-xs ${unread ? "font-bold text-[#34443e]" : "text-[#81908a]"}`}>
            {latest ? `${latest.senderId === userId ? "You: " : ""}${latest.body}` : "Start the conversation"}
          </p>
          {unread > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#174f3f] px-1.5 py-0.5 text-[10px] font-black text-white">{unread > 99 ? "99+" : unread}</span>}
        </div>
      </div>
    </button>
  );
}

export function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    messages,
    loadingConversations,
    connected,
    setActiveConversationId,
    loadMessages,
    sendMessage,
    markRead,
  } = useMessaging();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastVisibleMessage = useRef<{ conversationId?: string; messageId?: string }>({});
  const selected = conversations.find((item) => item.id === conversationId);
  const selectedMessages = conversationId
    ? messages[conversationId] || EMPTY_MESSAGES
    : EMPTY_MESSAGES;
  const person = selected && user ? otherParticipant(selected, user.id) : null;

  const filtered = useMemo(() => {
    if (!user) return [];
    const query = search.trim().toLowerCase();
    return conversations.filter((conversation) =>
      (otherParticipant(conversation, user.id).displayName || "Havenly member")
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, search, user]);

  useEffect(() => {
    setActiveConversationId(conversationId || null);
    if (!conversationId) return;
    setNextCursor(undefined);
    setLoadingHistory(true);
    loadMessages(conversationId)
      .then(setNextCursor)
      .catch((error) => toast.error(friendlyError(error)))
      .finally(() => setLoadingHistory(false));
    void markRead(conversationId).catch(() => undefined);
    return () => setActiveConversationId(null);
  }, [conversationId, loadMessages, markRead, setActiveConversationId]);

  useEffect(() => {
    const newestId = selectedMessages[selectedMessages.length - 1]?.id;
    const changedConversation = lastVisibleMessage.current.conversationId !== conversationId;
    const receivedNewMessage = Boolean(
      newestId && newestId !== lastVisibleMessage.current.messageId,
    );
    lastVisibleMessage.current = { conversationId, messageId: newestId };
    if (changedConversation || receivedNewMessage) {
      bottomRef.current?.scrollIntoView({
        behavior: changedConversation ? "auto" : "smooth",
      });
    }
  }, [selectedMessages, conversationId]);

  useEffect(() => {
    const newest = selectedMessages[selectedMessages.length - 1];
    if (conversationId && newest && newest.senderId !== user?.id && !newest.readAt) {
      void markRead(conversationId).catch(() => undefined);
    }
  }, [conversationId, selectedMessages, markRead, user?.id]);

  async function loadOlder() {
    if (!conversationId || !nextCursor) return;
    setLoadingHistory(true);
    try {
      setNextCursor(await loadMessages(conversationId, nextCursor));
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setLoadingHistory(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!conversationId || !body || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId, draft);
      setDraft("");
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;
  return (
    <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_18px_60px_rgba(26,45,38,.09)]">
      <div className="grid h-[calc(100vh-190px)] min-h-[620px] md:grid-cols-[340px_1fr]">
        <aside className={`${conversationId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-black/6 bg-[#fbfbf8]`}>
          <div className="border-b border-black/6 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Stay connected</p>
                <h1 className="mt-1 font-[var(--font-display)] text-2xl font-black">Messages</h1>
              </div>
              <span title={connected ? "Live updates connected" : "Reconnecting"} className={`size-2.5 rounded-full ${connected ? "bg-[#45a880] shadow-[0_0_0_4px_rgba(69,168,128,.12)]" : "animate-pulse bg-[#e2a33d]"}`} />
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-black/7 bg-white px-3.5 py-2.5 focus-within:border-[#27775f] focus-within:ring-3 focus-within:ring-[#27775f]/10">
              <Search size={16} className="text-[#92a09b]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
            {loadingConversations && conversations.length === 0 ? (
              <div className="grid h-40 place-items-center"><LoaderCircle className="animate-spin text-[#27775f]" /></div>
            ) : filtered.length ? filtered.map((conversation) => (
              <ConversationRow key={conversation.id} conversation={conversation} active={conversation.id === conversationId} userId={user.id} onClick={() => navigate(`/app/messages/${conversation.id}`)} />
            )) : (
              <div className="px-5 py-16 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e9f3ef] text-[#27775f]"><MessageCircle /></span>
                <p className="mt-4 text-sm font-extrabold">{search ? "No conversations found" : "No messages yet"}</p>
                <p className="mt-1 text-xs leading-5 text-[#81908a]">{search ? "Try another name." : "Start a conversation from Discover."}</p>
              </div>
            )}
          </div>
        </aside>

        <section className={`${conversationId ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-white`}>
          {!selected || !person ? (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#e8f3ee] text-[#174f3f]"><Sparkles size={28} /></span>
                <h2 className="mt-5 font-[var(--font-display)] text-xl font-black">Your conversations live here</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#71807b]">Choose someone from the list or meet a compatible flatmate in Discover.</p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-black/6 px-4 sm:px-6">
                <button onClick={() => navigate("/app/messages")} className="grid size-9 place-items-center rounded-xl hover:bg-[#f1f3ef] md:hidden" aria-label="Back to conversations"><ArrowLeft size={19} /></button>
                <Avatar person={person} />
                <div className="min-w-0">
                  <h2 className="truncate font-[var(--font-display)] text-base font-black">{person.displayName || "Havenly member"}</h2>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7c8b85]"><span className={`size-1.5 rounded-full ${connected ? "bg-[#45a880]" : "bg-[#d7a03f]"}`} />{connected ? "Messages update live" : "Reconnecting…"}</p>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fbfcfa_0%,#fff_100%)] px-4 py-5 sm:px-7">
                {nextCursor && <div className="mb-5 text-center"><button onClick={loadOlder} disabled={loadingHistory} className="inline-flex items-center gap-2 rounded-full border border-black/7 bg-white px-4 py-2 text-xs font-bold text-[#5c6a65] hover:border-[#27775f]"><ArrowDown size={14} className="rotate-180" />{loadingHistory ? "Loading…" : "Load earlier messages"}</button></div>}
                {loadingHistory && selectedMessages.length === 0 ? (
                  <div className="grid h-full place-items-center"><LoaderCircle className="animate-spin text-[#27775f]" /></div>
                ) : selectedMessages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center"><div><Avatar person={person} size="size-16" /><p className="mt-4 font-extrabold">Say hello to {person.displayName || "your new match"}</p><p className="mt-1 text-xs text-[#84918c]">A good home can start with a simple message.</p></div></div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-2">
                    {selectedMessages.map((message, index) => <MessageBubble key={message.id} message={message} mine={message.senderId === user.id} showTime={index === 0 || new Date(message.createdAt).getTime() - new Date(selectedMessages[index - 1].createdAt).getTime() > 10 * 60 * 1000} />)}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
              <form onSubmit={submit} className="shrink-0 border-t border-black/6 bg-white p-3 sm:p-4">
                <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#dfe3de] bg-[#fafbf9] p-2 focus-within:border-[#27775f] focus-within:ring-3 focus-within:ring-[#27775f]/10">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 4000))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={4000} placeholder="Write a message…" className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none" />
                  <span className={`mb-3 hidden text-[10px] sm:block ${draft.length > 3800 ? "text-[#c8624c]" : "text-[#a0aaa6]"}`}>{draft.length}/4000</span>
                  <button type="submit" disabled={!draft.trim() || sending} className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#174f3f] text-white shadow-sm hover:bg-[#103e31] disabled:opacity-40" aria-label="Send message">{sending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}</button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function MessageBubble({ message, mine, showTime }: { message: ChatMessage; mine: boolean; showTime: boolean }) {
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      {showTime && <time className="mb-2 mt-3 px-1 text-[10px] font-bold uppercase tracking-wider text-[#a0aaa6]">{new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</time>}
      <div className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-5 ${mine ? "rounded-br-md bg-[#174f3f] text-white" : "rounded-bl-md bg-[#eef2ef] text-[#26332f]"}`}>{message.body}</div>
      {mine && <span className="mt-1 flex items-center gap-1 px-1 text-[9px] font-semibold text-[#98a49f]"><CheckCheck size={12} className={message.readAt ? "text-[#3d9678]" : ""} />{message.readAt ? "Read" : "Sent"}</span>}
    </div>
  );
}
