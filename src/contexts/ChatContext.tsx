import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Conversation, Message, Personality } from '../types';
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  generateTitle,
} from '../services/dbService';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isLoading: boolean;
  isSending: boolean;
  sidebarOpen: boolean;
  personality: Personality;
  setSidebarOpen: (open: boolean) => void;
  setPersonality: (p: Personality) => void;
  selectConversation: (id: string) => void;
  createNewConversation: () => Promise<void>;
  deleteConv: (id: string) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<string>;
  updateLastMessage: (convId: string, messageId: string, content: string) => void;
  setIsSending: (v: boolean) => void;
  loadConversations: () => Promise<void>;
  updateConversationTitle: (id: string, title: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [personality, setPersonality] = useState<Personality>('helpful');

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const convos = await getConversations(currentUser.uid);
      // Sort by updatedAt descending (newest first) — done client side
      const sorted = convos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setConversations(sorted);
      if (convos.length > 0 && !activeConversationId) {
        setActiveConversationId(convos[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeConversationId]);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveConversationId(null);
    }
  }, [currentUser]);

  const createNewConversation = async () => {
    if (!currentUser) return;
    try {
      const convo = await createConversation(currentUser.uid, 'New Chat', personality);
      setConversations(prev => [convo, ...prev]);
      setActiveConversationId(convo.id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const deleteConv = async (id: string) => {
    await deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<string> => {
    if (!activeConversationId || !currentUser) {
      // Create conversation if none exists
      const convo = await createConversation(currentUser!.uid, 'New Chat', personality);
      setConversations(prev => [convo, ...prev]);
      setActiveConversationId(convo.id);

      const newMsg: Message = { ...message, id: uuidv4(), timestamp: new Date() };
      const updated = { ...convo, messages: [newMsg], updatedAt: new Date() };
      setConversations(prev => prev.map(c => c.id === convo.id ? updated : c));
      
      const title = message.role === 'user' ? await generateTitle(message.content) : convo.title;
      await updateConversation(convo.id, [newMsg], title);
      return newMsg.id;
    }

    const newMsg: Message = { ...message, id: uuidv4(), timestamp: new Date() };

    setConversations(prev => prev.map(c => {
      if (c.id !== activeConversationId) return c;
      return { ...c, messages: [...c.messages, newMsg], updatedAt: new Date() };
    }));

    const conv = conversations.find(c => c.id === activeConversationId);
    if (conv) {
      const updatedMessages = [...conv.messages, newMsg];
      let title = conv.title;
      if (conv.messages.length === 0 && message.role === 'user') {
        title = await generateTitle(message.content);
        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, title } : c));
      }
      await updateConversation(activeConversationId, updatedMessages, title);
    }

    return newMsg.id;
  };

  const updateLastMessage = (convId: string, _messageId: string, content: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      if (c.messages.length === 0) return c;
      const msgs = [...c.messages];
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      return { ...c, messages: msgs, updatedAt: new Date() };
    }));
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, title } : c
    ));
    // Persist to Firestore
    import('../services/dbService').then(({ updateConversation }) => {
      const conv = conversations.find(c => c.id === id);
      if (conv) updateConversation(id, conv.messages, title).catch(() => {});
    });
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      isLoading,
      isSending,
      sidebarOpen,
      personality,
      setSidebarOpen,
      setPersonality,
      selectConversation,
      createNewConversation,
      deleteConv,
      addMessage,
      updateLastMessage,
      setIsSending,
      loadConversations,
      updateConversationTitle,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
