import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { API_BASE_URL, api, friendlyError } from "../lib/api";
import type {
  ChatMessage,
  Conversation,
  ConversationReadReceipt,
} from "../types";

type MessagingContextValue = {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  loadingConversations: boolean;
  connected: boolean;
  unreadCount: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  refreshConversations: () => Promise<void>;
  openConversation: (recipientId: string) => Promise<Conversation>;
  loadMessages: (conversationId: string, cursor?: string) => Promise<string | null>;
  sendMessage: (conversationId: string, body: string) => Promise<ChatMessage>;
  markRead: (conversationId: string) => Promise<void>;
};

const MessagingContext = createContext<MessagingContextValue | null>(null);

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
      a.id.localeCompare(b.id),
  );
}

function latestFirst(conversations: Conversation[]) {
  return [...conversations].sort((a, b) => {
    const aTime = a.lastMessageAt || a.createdAt;
    const bTime = b.lastMessageAt || b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { accessToken, user, logout } = useAuth();
  const userId = user?.id;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [connected, setConnected] = useState(false);
  const [activeConversationId, setActiveConversationIdState] = useState<
    string | null
  >(null);
  const activeConversationRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const setActiveConversationId = useCallback((id: string | null) => {
    activeConversationRef.current = id;
    setActiveConversationIdState(id);
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!accessToken) return;
    setLoadingConversations(true);
    try {
      setConversations(latestFirst(await api.getConversations()));
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setLoadingConversations(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !userId) {
      setConversations([]);
      setMessages({});
      return;
    }
    void refreshConversations();
  }, [accessToken, userId, refreshConversations]);

  useEffect(() => {
    if (!accessToken || !userId) return;

    const socketOrigin = new URL(API_BASE_URL).origin;
    const socket = io(`${socketOrigin}/chat`, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      setConnected(false);
      toast.error(error.message || "Could not connect to live messages");
    });
    socket.on("realtime:error", () => {
      toast.error("Your session expired. Please sign in again.");
      logout();
    });
    socket.on("exception", (error: { message?: string }) => {
      toast.error(error?.message || "Realtime messaging failed");
    });
    socket.on("message:new", (message: ChatMessage) => {
      setMessages((current) => ({
        ...current,
        [message.conversationId]: mergeMessages(
          current[message.conversationId] || [],
          [message],
        ),
      }));
      setConversations((current) => {
        const existing = current.find((item) => item.id === message.conversationId);
        if (!existing) {
          void refreshConversations();
          return current;
        }
        const unread =
          message.senderId !== userId &&
          activeConversationRef.current !== message.conversationId
            ? (existing._count?.messages || 0) + 1
            : existing._count?.messages || 0;
        return latestFirst([
          {
            ...existing,
            lastMessageAt: message.createdAt,
            updatedAt: message.createdAt,
            messages: [message],
            _count: { messages: unread },
          },
          ...current.filter((item) => item.id !== message.conversationId),
        ]);
      });
    });
    socket.on("conversation:read", (receipt: ConversationReadReceipt) => {
      setMessages((current) => ({
        ...current,
        [receipt.conversationId]: (current[receipt.conversationId] || []).map(
          (message) =>
            message.senderId !== receipt.userId
              ? { ...message, readAt: message.readAt || receipt.readAt }
              : message,
        ),
      }));
      if (receipt.userId === userId) {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === receipt.conversationId
              ? { ...conversation, _count: { messages: 0 } }
              : conversation,
          ),
        );
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [accessToken, userId, logout, refreshConversations]);

  const openConversation = useCallback(async (recipientId: string) => {
    const conversation = await api.getOrCreateConversation(recipientId);
    setConversations((current) =>
      latestFirst([
        { ...conversation, messages: conversation.messages || [], _count: conversation._count || { messages: 0 } },
        ...current.filter((item) => item.id !== conversation.id),
      ]),
    );
    return conversation;
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, cursor?: string) => {
      const page = await api.getMessages(conversationId, 50, cursor);
      setMessages((current) => ({
        ...current,
        [conversationId]: mergeMessages(
          current[conversationId] || [],
          page.items,
        ),
      }));
      return page.nextCursor;
    },
    [],
  );

  const sendMessage = useCallback(async (conversationId: string, body: string) => {
    const message = await api.sendMessage(conversationId, body);
    setMessages((current) => ({
      ...current,
      [conversationId]: mergeMessages(current[conversationId] || [], [message]),
    }));
    setConversations((current) => {
      const existing = current.find((item) => item.id === conversationId);
      if (!existing) return current;
      return latestFirst([
        {
          ...existing,
          lastMessageAt: message.createdAt,
          updatedAt: message.createdAt,
          messages: [message],
        },
        ...current.filter((item) => item.id !== conversationId),
      ]);
    });
    return message;
  }, []);

  const markRead = useCallback(async (conversationId: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, _count: { messages: 0 } }
          : conversation,
      ),
    );
    await api.markConversationRead(conversationId);
  }, []);

  const unreadCount = useMemo(
    () => conversations.reduce((total, item) => total + (item._count?.messages || 0), 0),
    [conversations],
  );

  const value = useMemo<MessagingContextValue>(
    () => ({
      conversations,
      messages,
      loadingConversations,
      connected,
      unreadCount,
      activeConversationId,
      setActiveConversationId,
      refreshConversations,
      openConversation,
      loadMessages,
      sendMessage,
      markRead,
    }),
    [
      conversations,
      messages,
      loadingConversations,
      connected,
      unreadCount,
      activeConversationId,
      setActiveConversationId,
      refreshConversations,
      openConversation,
      loadMessages,
      sendMessage,
      markRead,
    ],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

export function useMessaging() {
  const value = useContext(MessagingContext);
  if (!value) throw new Error("useMessaging must be used within MessagingProvider");
  return value;
}
