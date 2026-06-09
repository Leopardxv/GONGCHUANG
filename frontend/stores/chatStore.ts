import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "@/services/ai.service";

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

interface PerUserData {
  conversations: Conversation[];
  activeConversationId: string | null;
}

interface ChatState {
  currentUserId: string | null;
  userData: Record<string, PerUserData>;
  conversations: Conversation[];
  activeConversationId: string | null;

  setUserId: (id: string) => void;
  clearUserId: () => void;
  newConversation: () => string;
  setActiveConversation: (id: string) => void;
  addMessage: (convId: string, msg: ChatMessage) => void;
  deleteConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      userData: {},
      conversations: [],
      activeConversationId: null,

      setUserId: (id: string) => {
        const s = get();
        if (s.currentUserId === id) return;
        const prevId = s.currentUserId;
        const updated = { ...s.userData };
        if (prevId) {
          updated[prevId] = {
            conversations: s.conversations,
            activeConversationId: s.activeConversationId,
          };
        }
        const next = updated[id] ?? { conversations: [], activeConversationId: null };
        set({
          currentUserId: id,
          userData: updated,
          conversations: next.conversations,
          activeConversationId: next.activeConversationId,
        });
      },

      clearUserId: () => {
        const s = get();
        const prevId = s.currentUserId;
        if (!prevId) {
          set({ currentUserId: null, conversations: [], activeConversationId: null });
          return;
        }
        const updated = { ...s.userData };
        updated[prevId] = {
          conversations: s.conversations,
          activeConversationId: s.activeConversationId,
        };
        set({
          currentUserId: null,
          userData: updated,
          conversations: [],
          activeConversationId: null,
        });
      },

      newConversation: () => {
        const id = crypto.randomUUID();
        const conv: Conversation = {
          id,
          title: "新对话",
          messages: [],
          createdAt: Date.now(),
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (convId, msg) => {
        set((s) => {
          const conversations = s.conversations.map((c) => {
            if (c.id !== convId) return c;
            const messages = [...c.messages, msg];
            const title =
              c.title === "新对话" && msg.role === "user"
                ? msg.content.slice(0, 24)
                : c.title;
            return { ...c, messages, title };
          });
          return { conversations };
        });
      },

      deleteConversation: (id) => {
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeConversationId =
            s.activeConversationId === id
              ? conversations[0]?.id ?? null
              : s.activeConversationId;
          return { conversations, activeConversationId };
        });
      },
    }),
    { name: "ll-chat-store" },
  ),
);
