// src/pages/MessagesPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import type { Conversation, Message } from "../types";

const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { error: showError, success } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentFriendId, setCurrentFriendId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [typing, setTyping] = useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef<boolean>(true);
  const currentFriendRef = useRef<number | null>(null);

  // ================= INIT =================
  useEffect(() => {
    isActiveRef.current = true;
    loadConversations();

    return () => {
      isActiveRef.current = false;

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // ================= URL PARAM =================
  useEffect(() => {
    const friendId = searchParams.get("friend");
    if (friendId && !currentFriendId) {
      openChat(parseInt(friendId));
    }
  }, [searchParams]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ================= LOAD CONVERSATIONS =================
  const loadConversations = async (): Promise<void> => {
    try {
      const data = await api.get<Conversation[]>(
        "/api/messages/conversations",
        true,
      );

      if (!isActiveRef.current) return;
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      if (isActiveRef.current) setLoading(false);
    }
  };

  // ================= LOAD MESSAGES =================
  const loadMessages = async (
    friendId: number,
    silent: boolean = false,
  ): Promise<boolean> => {
    try {
      const data = await api.get<Message[]>(`/api/messages/${friendId}`, true);

      if (!isActiveRef.current) return false;

      if (Array.isArray(data)) {
        const newMessages = data.reverse();

        if (newMessages.length > 0) {
          const latestTimestamp = new Date(
            newMessages[newMessages.length - 1].created_at,
          ).getTime();

          if (latestTimestamp > lastMessageTimestamp) {
            setMessages(newMessages);
            setLastMessageTimestamp(latestTimestamp);

            if (!silent) loadConversations();
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      if (!silent) showError("Failed to load messages");
      return false;
    }
  };

  // ================= OPEN CHAT =================
  const openChat = async (friendId: number): Promise<void> => {
    setCurrentFriendId(friendId);
    currentFriendRef.current = friendId;
    setLastMessageTimestamp(0);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    await loadMessages(friendId);

    pollIntervalRef.current = setInterval(async () => {
      if (currentFriendRef.current === friendId) {
        await loadMessages(friendId, true);
      }
    }, 3000);
  };

  // ================= SEND MESSAGE =================
  const sendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || !currentFriendId) return;

    setSending(true);

    try {
      const data = await api.post(
        "/api/messages",
        {
          receiver_id: currentFriendId,
          message: newMessage.trim(),
        },
        true,
      );

      if (data && !data.error) {
        setNewMessage("");
        await loadMessages(currentFriendId, true);
        loadConversations();
        success("Message sent!");
      } else {
        showError(data?.error || "Failed to send message");
      }
    } catch {
      showError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // ================= TYPING =================
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    if (typingTimeout) clearTimeout(typingTimeout);

    setTyping(true);

    const timeout = setTimeout(() => {
      if (isActiveRef.current) setTyping(false);
    }, 1000);

    setTypingTimeout(timeout);
  };

  // ================= ENTER SEND =================
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ================= FILTER =================
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.friend_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentConversation = conversations.find(
    (c) => c.friend_id === currentFriendId,
  );

  const currentFriendName = currentConversation?.friend_name || "User";

  // ================= TIME =================
  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;

    return new Date(dateStr).toLocaleDateString();
  };

  // ================= UI =================
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">💬 Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar */}
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full mb-3 p-2 rounded bg-black/20"
          />

          {filteredConversations.map((conv) => (
            <button
              key={conv.friend_id}
              onClick={() => openChat(conv.friend_id)}
              className="block w-full text-left p-2 border-b"
            >
              {conv.friend_name}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="col-span-2 flex flex-col">
          {currentFriendId ? (
            <>
              <div className="flex-1 overflow-y-auto space-y-2">
                {messages.map((msg) => {
                  const isSent = msg.sender_id === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={isSent ? "text-right" : "text-left"}
                    >
                      <span className="inline-block bg-indigo-500 p-2 rounded">
                        {msg.message}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2 mt-2">
                <textarea
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  className="flex-1 p-2 rounded bg-black/20"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending}
                  className="px-4 bg-indigo-500 rounded"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p>Select a chat</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
