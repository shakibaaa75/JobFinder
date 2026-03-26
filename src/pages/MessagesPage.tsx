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
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(true);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= LOAD CONVERSATIONS =================
  const loadConversations = async () => {
    try {
      const data = await api.get<Conversation[]>(
        "/api/messages/conversations",
        true,
      );

      if (!isActiveRef.current) return;
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      if (isActiveRef.current) setLoading(false);
    }
  };

  // ================= LOAD MESSAGES =================
  const loadMessages = async (
    friendId: number,
    silent = false,
  ): Promise<boolean> => {
    try {
      const data = await api.get<Message[]>(`/api/messages/${friendId}`, true);

      if (!isActiveRef.current) return false;

      if (Array.isArray(data)) {
        const newMessages = data.reverse();

        if (newMessages.length > 0) {
          const latest = new Date(
            newMessages[newMessages.length - 1].created_at,
          ).getTime();

          if (latest > lastMessageTimestamp) {
            setMessages(newMessages);
            setLastMessageTimestamp(latest);

            if (!silent) loadConversations();
            return true;
          }
        }
      }

      return false;
    } catch {
      if (!silent) showError("Failed to load messages");
      return false;
    }
  };

  // ================= OPEN CHAT =================
  const openChat = async (friendId: number) => {
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

  // ================= SEND =================
  const sendMessage = async () => {
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
        showError("Failed to send message");
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ================= FILTER =================
  const filteredConversations = conversations.filter(
    (c) =>
      c.friend_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message.toLowerCase().includes(searchQuery.toLowerCase()),
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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">💬 Messages</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {/* SIDEBAR */}
        <div>
          <input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-black/20"
          />

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <button
                key={conv.friend_id}
                onClick={() => openChat(conv.friend_id)}
                className="block w-full text-left p-2 border-b hover:bg-white/5"
              >
                <div className="font-medium">{conv.friend_name}</div>
                <div className="text-xs text-gray-400">{conv.last_message}</div>
              </button>
            ))
          ) : (
            <p className="text-gray-500">No conversations</p>
          )}
        </div>

        {/* CHAT */}
        <div className="md:col-span-2 flex flex-col">
          {currentFriendId ? (
            <>
              {/* HEADER */}
              <div className="mb-3 font-semibold">
                Chat with {currentFriendName}
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {messages.map((msg) => {
                  const isSent = msg.sender_id === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={isSent ? "text-right" : "text-left"}
                    >
                      <div className="inline-block">
                        <div className="bg-indigo-500 text-white px-3 py-2 rounded">
                          {msg.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {timeAgo(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT */}
              <div>
                <textarea
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 rounded bg-black/20"
                  placeholder="Type message..."
                />

                {typing && (
                  <p className="text-xs text-gray-400 mt-1">Typing...</p>
                )}

                <button
                  onClick={sendMessage}
                  disabled={sending}
                  className="mt-2 px-4 py-2 bg-indigo-600 rounded"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </>
          ) : (
            <p>Select a conversation</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
