// src/pages/MessagesPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom"; // <-- Added Link here
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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadConversations();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const friendId = searchParams.get("friend");
    if (friendId) {
      const parsedId = parseInt(friendId);
      if (!isNaN(parsedId)) {
        openChat(parsedId);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ FIX: Proper error handling
  const loadConversations = async (): Promise<void> => {
    try {
      const results = await api.get<Conversation[]>(
        "/api/messages/conversations",
        true,
      );
      setConversations(Array.isArray(results) ? results : []);
    } catch (err: any) {
      console.error("Failed to load conversations:", err);
      showError(err.response?.data?.error || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Proper error handling with silent option
  const loadMessages = async (
    friendId: number,
    silent: boolean = false,
  ): Promise<void> => {
    try {
      const results = await api.get<Message[]>(
        `/api/messages/${friendId}`,
        true,
      );
      if (Array.isArray(results)) {
        setMessages(results.reverse());
        if (!silent) {
          loadConversations();
        }
      }
    } catch (err: any) {
      if (!silent) {
        showError(err.response?.data?.error || "Failed to load messages");
      }
    }
  };

  const openChat = async (friendId: number): Promise<void> => {
    setCurrentFriendId(friendId);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    await loadMessages(friendId);

    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      loadMessages(friendId, true);
    }, 3000);
  };

  // ✅ FIX: Proper error handling for sending messages
  const sendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || !currentFriendId) return;

    setSending(true);
    try {
      await api.post(
        "/api/messages",
        {
          receiver_id: currentFriendId,
          message: newMessage.trim(),
        },
        true,
      );

      setNewMessage("");
      await loadMessages(currentFriendId, true);
      loadConversations();
      success("Message sent!");
    } catch (err: any) {
      console.error("Failed to send message:", err);
      showError(err.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    if (!typing) {
      setTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.friend_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentConversation = conversations.find(
    (c) => c.friend_id === currentFriendId,
  );
  const currentFriendName = currentConversation?.friend_name || "User";

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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              💬{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Messages
              </span>
            </h1>
            <p className="text-gray-500">Chat with your friends</p>
          </div>
          <Link
            to="/friends"
            className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition"
          >
            👥 View Friends
          </Link>
        </div>
      </div>

      <div className="bg-[#16161f] border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-220px)]">
          {/* Conversations Sidebar */}
          <div className="border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-[#111118] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                Array(3)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="p-4 border-b border-white/10 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
                          <div className="h-3 w-32 bg-gray-700 rounded" />
                        </div>
                      </div>
                    </div>
                  ))
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.friend_id}
                    onClick={() => openChat(conv.friend_id)}
                    className={`w-full p-4 border-b border-white/10 hover:bg-white/5 transition text-left ${
                      currentFriendId === conv.friend_id
                        ? "bg-indigo-500/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {conv.friend_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium truncate">
                            {conv.friend_name}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-600 rounded-full text-xs text-white">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conv.last_message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {timeAgo(conv.last_message_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-gray-500">No conversations yet</p>
                  <Link
                    to="/friends"
                    className="text-indigo-400 text-sm mt-2 inline-block"
                  >
                    Find Friends →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 flex flex-col">
            {currentFriendId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <Link
                    to={`/user/${currentFriendId}`}
                    className="flex items-center gap-3 hover:opacity-80 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {currentFriendName[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{currentFriendName}</div>
                      <div className="text-xs text-green-400">● Online</div>
                    </div>
                  </Link>
                  <button
                    onClick={() => setCurrentFriendId(null)}
                    className="text-gray-500 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">👋</div>
                      <p className="text-gray-500">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSent = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] ${isSent ? "order-2" : "order-1"}`}
                          >
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isSent
                                  ? "bg-indigo-600 text-white rounded-br-none"
                                  : "bg-[#111118] text-gray-300 rounded-bl-none"
                              }`}
                            >
                              {msg.message}
                            </div>
                            <div
                              className={`text-xs text-gray-500 mt-1 ${isSent ? "text-right" : "text-left"}`}
                            >
                              {timeAgo(msg.created_at)}
                              {isSent && msg.is_read && (
                                <span className="ml-2 text-indigo-400">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-3">
                    <textarea
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... (Enter to send)"
                      rows={1}
                      className="flex-1 px-4 py-2 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                  {typing && (
                    <p className="text-xs text-gray-500 mt-2 animate-pulse">
                      Typing...
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a friend from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
