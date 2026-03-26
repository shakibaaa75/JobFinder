// src/pages/MessagesPage.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useWebSocket } from "../hooks/useWebSocket";
import api from "../services/api";
import type { Conversation, Message } from "../types";

import { MediaUpload } from "../components/MediaUpload";
import { MediaMessage } from "../components/MediaMessage";

interface ExtendedMessage extends Message {
  media_type?: "image" | "video";
  file_path?: string;
  file_name?: string;
  file_size?: number;
  is_replying_to?: number | null;
  reply_to_message?: ExtendedMessage | null;
  pending?: boolean;
  tempId?: number;
}

const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  const { error: showError, success: showSuccess } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentFriendId, setCurrentFriendId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(true);
  const currentFriendRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ExtendedMessage[]>([]);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const {
    lastMessage,
    sendMessage: sendWSMessage,
    isConnected,
  } = useWebSocket(user?.id ?? null, token);

  // DEBUG: Log WebSocket status
  useEffect(() => {
    console.log("🔌 WebSocket status:", {
      userId: user?.id,
      hasToken: !!token,
      isConnected,
    });
  }, [user?.id, token, isConnected]);

  // Prevent zoom on iOS
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
      );
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.get<Conversation[]>(
        "/api/messages/conversations",
        true,
      );
      if (!isActiveRef.current) return;
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      if (isActiveRef.current) setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (friendId: number) => {
      try {
        const [textMessages, mediaMessages] = await Promise.all([
          api.get<ExtendedMessage[]>(`/api/messages/${friendId}`, true),
          api.get<ExtendedMessage[]>(`/api/media/messages/${friendId}`, true),
        ]);

        const serverMessages = [
          ...(textMessages || []),
          ...(mediaMessages || []),
        ].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        const currentMessages = messagesRef.current;
        const pendingMessages = currentMessages.filter(
          (m) => m.pending && m.sender_id === user?.id,
        );

        const confirmedIds = new Set(serverMessages.map((m) => m.id));
        const stillPending = pendingMessages.filter(
          (m) => !confirmedIds.has(m.id) && !confirmedIds.has(m.tempId || m.id),
        );

        const merged = [...serverMessages, ...stillPending].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        if (!isActiveRef.current) return;
        setMessages(merged);
      } catch (err) {
        console.error("Failed to load messages:", err);
        showError("Failed to load messages");
      }
    },
    [showError, user?.id],
  );

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    const msg = lastMessage as any;

    console.log("📨 WebSocket received in MessagesPage:", msg);

    if (msg.type === "new_message") {
      if (msg.sender_id !== currentFriendRef.current) {
        loadConversations();
        return;
      }

      setMessages((prev) => {
        const matchingPending = prev.find(
          (m) =>
            m.pending &&
            m.message === msg.message &&
            m.sender_id === msg.sender_id,
        );

        if (matchingPending) {
          return prev.map((m) =>
            m.id === matchingPending.id
              ? {
                  ...m,
                  id: msg.id || msg.message_id,
                  pending: false,
                  tempId: undefined,
                }
              : m,
          );
        }

        if (prev.find((m) => m.id === (msg.id || msg.message_id))) {
          return prev;
        }

        const incoming: ExtendedMessage = {
          id: msg.id || msg.message_id || Date.now(),
          sender_id: msg.sender_id,
          receiver_id: user!.id,
          message: msg.message,
          created_at: msg.created_at || new Date().toISOString(),
          is_read: false,
          sender_name: msg.sender_name,
          is_replying_to: msg.reply_to_id || msg.is_replying_to,
          reply_to_message: msg.reply_to_message || null,
          pending: false,
        };
        return [...prev, incoming];
      });

      loadConversations();
    }

    if (msg.type === "typing") {
      console.log(
        "⌨️ Typing received from:",
        msg.sender_id,
        "Current friend:",
        currentFriendRef.current,
      );

      if (msg.sender_id !== currentFriendRef.current) return;

      if (typingClearRef.current) {
        clearTimeout(typingClearRef.current);
      }

      setTypingUsers((prev) => {
        const filtered = prev.filter((id) => id !== msg.sender_id);
        return [...filtered, msg.sender_id];
      });

      typingClearRef.current = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== msg.sender_id));
      }, 3000);
    }

    if (msg.type === "message_read") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.message_id ? { ...m, is_read: true } : m,
        ),
      );
      loadConversations();
    }
  }, [lastMessage, user, loadConversations]);

  useEffect(() => {
    isActiveRef.current = true;
    loadConversations();

    return () => {
      isActiveRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [loadConversations]);

  useEffect(() => {
    const friendId = searchParams.get("friend");
    if (friendId && !currentFriendId) {
      openChat(parseInt(friendId));
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleTyping = useCallback(() => {
    console.log(
      "⌨️ handleTyping called, isConnected:",
      isConnected,
      "currentFriendId:",
      currentFriendId,
    );

    if (!isConnected) {
      console.warn("Cannot send typing - WebSocket not connected");
      return;
    }

    if (!isTyping && currentFriendId) {
      setIsTyping(true);
      sendWSMessage({
        type: "typing",
        receiver_id: currentFriendId,
        is_typing: true,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && currentFriendId) {
        setIsTyping(false);
        sendWSMessage({
          type: "typing",
          receiver_id: currentFriendId,
          is_typing: false,
        });
      }
    }, 1000);
  }, [isTyping, currentFriendId, sendWSMessage, isConnected]);

  const openChat = useCallback(
    async (friendId: number) => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      setCurrentFriendId(friendId);
      currentFriendRef.current = friendId;
      setMessages([]);
      setReplyingTo(null);
      setTypingUsers([]);

      await loadMessages(friendId);

      pollIntervalRef.current = setInterval(() => {
        if (currentFriendRef.current === friendId && isActiveRef.current) {
          loadMessages(friendId);
        }
      }, 5000);
    },
    [loadMessages],
  );

  const sendMessage = async () => {
    if (!newMessage.trim() && !replyingTo) return;
    if (!currentFriendId) return;

    setSending(true);
    const text = newMessage.trim();
    const replyToId = replyingTo?.id || null;
    const tempId = Date.now();

    setNewMessage("");
    setReplyingTo(null);

    const optimisticMsg: ExtendedMessage = {
      id: tempId,
      tempId: tempId,
      sender_id: user!.id,
      receiver_id: currentFriendId,
      message: text,
      created_at: new Date().toISOString(),
      is_read: false,
      sender_name: user!.name,
      is_replying_to: replyToId,
      reply_to_message: replyingTo,
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const data = await api.post(
        "/api/messages",
        { receiver_id: currentFriendId, message: text, reply_to_id: replyToId },
        true,
      );

      if (data && (data.id || data.ID) && !data.error) {
        const serverId = data.id || data.ID;

        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId || m.id === tempId
              ? {
                  ...m,
                  id: serverId,
                  tempId: undefined,
                  pending: false,
                  is_read: data.is_read || false,
                  created_at: data.created_at || m.created_at,
                  is_replying_to: data.is_replying_to || replyToId,
                  reply_to_message: m.reply_to_message,
                }
              : m,
          ),
        );

        sendWSMessage({
          type: "new_message",
          receiver_id: currentFriendId,
          message: text,
          message_id: serverId,
          reply_to_id: replyToId,
        });

        loadConversations();
      } else {
        throw new Error(data?.error || "Failed to send");
      }
    } catch (err) {
      console.error("Send message error:", err);
      showError("Failed to send message");
      setMessages((prev) =>
        prev.filter((m) => m.tempId !== tempId && m.id !== tempId),
      );
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleMediaUploadComplete = useCallback(() => {
    if (currentFriendId) {
      loadMessages(currentFriendId);
      loadConversations();
      showSuccess("Media uploaded successfully!");
    }
  }, [currentFriendId, loadMessages, loadConversations, showSuccess]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.friend_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentConversation = conversations.find(
    (c) => c.friend_id === currentFriendId,
  );
  const currentFriendName = currentConversation?.friend_name || "User";

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const groupedMessages = messages.reduce(
    (groups, msg) => {
      const date = new Date(msg.created_at).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
      return groups;
    },
    {} as Record<string, ExtendedMessage[]>,
  );

  return (
    <div className="h-screen bg-black flex flex-col md:max-w-6xl md:mx-auto md:p-4 md:h-[calc(100vh-80px)]">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1c1c1e] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Messages</h1>
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <span className="text-xs text-yellow-500">●</span>
          ) : (
            <span className="text-xs text-green-500">●</span>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-4 px-2">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
              ⚡ Reconnecting...
            </span>
          ) : (
            <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">
              🟢 Connected
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden md:grid md:grid-cols-3 md:gap-4">
        {/* SIDEBAR */}
        <div
          className={`${currentFriendId ? "hidden md:flex" : "flex"} flex-col bg-[#1c1c1e] md:bg-transparent min-h-0`}
        >
          <div className="p-3 md:p-0 md:mb-3">
            <input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#2c2c2e] md:bg-[#111118] border-0 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007aff] text-base md:text-sm"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin h-5 w-5 border-2 border-[#007aff] border-t-transparent rounded-full"></div>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <button
                  key={conv.friend_id}
                  onClick={() => openChat(conv.friend_id)}
                  className={`w-full text-left p-3 flex items-center gap-3 transition ${
                    currentFriendId === conv.friend_id
                      ? "bg-[#007aff]/20 md:bg-[#007aff]/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-[#007aff] flex items-center justify-center text-white text-lg md:text-base font-medium flex-shrink-0">
                    {conv.friend_name[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-medium text-white text-base md:text-sm truncate">
                        {conv.friend_name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-xs text-gray-400 truncate flex-1">
                        {conv.last_message}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-[#007aff] rounded-full text-xs text-white font-medium min-w-[20px] text-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-sm p-4 text-center">
                No conversations
              </p>
            )}
          </div>
        </div>

        {/* CHAT PANEL */}
        <div
          className={`${
            currentFriendId ? "flex" : "hidden md:flex"
          } flex-col flex-1 md:col-span-2 bg-black md:bg-[#16161f] md:rounded-2xl md:border md:border-white/10 overflow-hidden`}
        >
          {currentFriendId ? (
            <>
              {/* Chat Header */}
              <div className="bg-[#1c1c1e]/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => setCurrentFriendId(null)}
                    className="md:hidden text-[#007aff] text-lg font-medium"
                  >
                    ← Back
                  </button>
                  <div className="w-9 h-9 rounded-full bg-[#007aff] flex items-center justify-center text-white text-sm font-medium">
                    {currentFriendName[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white text-base leading-tight">
                      {currentFriendName}
                    </span>
                    {typingUsers.includes(currentFriendId) ? (
                      <span className="text-xs text-[#007aff] animate-pulse">
                        typing...
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Online</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                {messages.length === 0 &&
                  !typingUsers.includes(currentFriendId) && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">💬</div>
                        <p>No messages yet</p>
                      </div>
                    </div>
                  )}

                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date}>
                    {/* Date Separator */}
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-gray-500 bg-[#1c1c1e] px-3 py-1 rounded-full">
                        {formatDate(dateMessages[0].created_at)}
                      </span>
                    </div>

                    {dateMessages.map((msg, index) => {
                      const isSent = msg.sender_id === user?.id;
                      const showAvatar =
                        !isSent &&
                        (index === 0 ||
                          dateMessages[index - 1]?.sender_id !== msg.sender_id);

                      return (
                        <div key={msg.id} className="mb-1">
                          {/* Reply Preview */}
                          {msg.is_replying_to && msg.reply_to_message && (
                            <div
                              className={`flex ${
                                isSent ? "justify-end" : "justify-start"
                              } mb-1`}
                            >
                              <div
                                className={`max-w-[70%] text-xs text-gray-400 ${
                                  isSent ? "text-right mr-2" : "ml-12"
                                }`}
                              >
                                <span className="text-[#007aff]">
                                  ↩ Replying to{" "}
                                </span>
                                <span className="truncate inline-block max-w-[200px]">
                                  {msg.reply_to_message.message}
                                </span>
                              </div>
                            </div>
                          )}

                          <div
                            className={`flex ${
                              isSent ? "justify-end" : "justify-start"
                            } items-end gap-2`}
                          >
                            {/* Avatar */}
                            {!isSent && showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-[#007aff] flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mb-1">
                                {msg.sender_name?.[0]?.toUpperCase() ||
                                  currentFriendName[0]}
                              </div>
                            )}
                            {!isSent && !showAvatar && <div className="w-8" />}

                            <div
                              className={`max-w-[75%] md:max-w-[60%] group relative ${
                                isSent ? "mr-0" : "ml-0"
                              }`}
                            >
                              {/* Message Bubble */}
                              {msg.media_type && msg.file_path ? (
                                <MediaMessage
                                  id={msg.id}
                                  mediaType={msg.media_type}
                                  filePath={msg.file_path}
                                  fileName={msg.file_name || ""}
                                  fileSize={msg.file_size || 0}
                                  isOwn={isSent}
                                  createdAt={msg.created_at}
                                  onDelete={() => {
                                    if (currentFriendId) {
                                      loadMessages(currentFriendId);
                                      loadConversations();
                                    }
                                  }}
                                />
                              ) : (
                                <div
                                  className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed relative ${
                                    isSent
                                      ? "bg-[#007aff] text-white rounded-br-md"
                                      : "bg-[#2c2c2e] text-white rounded-bl-md"
                                  } ${msg.pending ? "opacity-70" : ""}`}
                                >
                                  {msg.message}
                                  {msg.pending && (
                                    <span className="ml-2 text-[10px] opacity-50">
                                      Sending...
                                    </span>
                                  )}

                                  <span
                                    className={`text-[10px] ml-2 opacity-60 ${
                                      isSent ? "text-white" : "text-gray-400"
                                    }`}
                                  >
                                    {formatTime(msg.created_at)}
                                  </span>
                                </div>
                              )}

                              {/* Read Receipt */}
                              {isSent && !msg.pending && (
                                <div className="text-right mt-0.5">
                                  {msg.is_read ? (
                                    <span className="text-[10px] text-[#007aff]">
                                      Read
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-500">
                                      Delivered
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Reply Button */}
                              {!isSent && !msg.pending && (
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className={`absolute -bottom-6 ${
                                    isSent ? "right-0" : "left-0"
                                  } text-xs text-[#007aff] opacity-0 group-hover:opacity-100 transition bg-black/80 px-2 py-1 rounded-full`}
                                >
                                  Reply
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* TYPING BUBBLE - iMessage Style */}
                {typingUsers.includes(currentFriendId) && (
                  <div className="flex justify-start items-end gap-2 mb-4 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-[#007aff] flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mb-1">
                      {currentFriendName[0].toUpperCase()}
                    </div>
                    <div className="bg-[#2c2c2e] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1 min-w-[60px]">
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{
                          animationDelay: "0ms",
                          animationDuration: "1.4s",
                        }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{
                          animationDelay: "0.2s",
                          animationDuration: "1.4s",
                        }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{
                          animationDelay: "0.4s",
                          animationDuration: "1.4s",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview */}
              {replyingTo && (
                <div className="bg-[#1c1c1e] border-t border-gray-800 px-4 py-2 flex items-center gap-3">
                  <div className="flex-1 bg-[#2c2c2e] rounded-lg px-3 py-2">
                    <span className="text-xs text-[#007aff] block mb-0.5">
                      Replying to
                    </span>
                    <span className="text-sm text-gray-300 truncate block">
                      {replyingTo.message}
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="bg-[#1c1c1e] border-t border-gray-800 px-3 py-2 pb-safe">
                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                  <div className="pb-2">
                    <MediaUpload
                      receiverId={currentFriendId}
                      onUploadComplete={handleMediaUploadComplete}
                      onError={showError}
                    />
                  </div>

                  <div className="flex-1 bg-[#2c2c2e] rounded-full px-4 py-2 flex items-end max-h-[100px]">
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-[16px] leading-5 py-1 max-h-[80px]"
                      placeholder="iMessage"
                      style={{ fontSize: "16px", minHeight: "20px" }}
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition mb-1 ${
                      newMessage.trim()
                        ? "bg-[#007aff] text-white"
                        : "bg-gray-700 text-gray-500"
                    }`}
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
              <div>
                <div className="text-6xl mb-4 text-gray-600">💬</div>
                <p className="text-gray-500 text-lg">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
