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
  reply_to_message?: Message;
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

  const {
    lastMessage,
    sendMessage: sendWSMessage,
    isConnected,
  } = useWebSocket(user?.id ?? null, token);

  // Load conversations
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

  // Load messages (text + media)
  const loadMessages = useCallback(
    async (friendId: number) => {
      try {
        // Fetch text messages
        const textMessages = await api.get<ExtendedMessage[]>(
          `/api/messages/${friendId}`,
          true,
        );

        // Fetch media messages
        const mediaMessages = await api.get<ExtendedMessage[]>(
          `/api/media/messages/${friendId}`,
          true,
        );

        // Combine and sort by date
        const allMessages = [
          ...(textMessages || []),
          ...(mediaMessages || []),
        ].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        if (!isActiveRef.current) return;
        setMessages(allMessages);

        console.log(
          `Loaded ${allMessages.length} messages (${textMessages?.length || 0} text, ${mediaMessages?.length || 0} media)`,
        );
      } catch (err) {
        console.error("Failed to load messages:", err);
        showError("Failed to load messages");
      }
    },
    [showError],
  );

  // Mark message as read
  // const markAsRead = useCallback(
  //   async (messageId: number) => {
  //     try {
  //       await api.put(`/api/messages/${messageId}/read`, {}, true);
  //       sendWSMessage({
  //         type: "message_read",
  //         message_id: messageId,
  //         reader_id: user!.id,
  //       });
  //     } catch (error) {
  //       console.error("Failed to mark as read:", error);
  //     }
  //   },
  //   [user, sendWSMessage],
  // );

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    const msg = lastMessage as any;

    console.log("WebSocket message received:", msg);

    // Handle new text message
    if (msg.type === "new_message") {
      if (msg.sender_id !== currentFriendRef.current) {
        loadConversations();
        return;
      }

      const incoming: ExtendedMessage = {
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: user!.id,
        message: msg.message,
        created_at: msg.created_at || new Date().toISOString(),
        is_read: false,
        sender_name: msg.sender_name,
        is_replying_to: msg.is_replying_to,
        reply_to_message: msg.reply_to_message,
      };

      setMessages((prev) => [...prev, incoming]);
      loadConversations();
    }

    // Handle new media message
    if (msg.type === "new_media" || msg.type === "media_message") {
      if (msg.sender_id !== currentFriendRef.current) {
        loadConversations();
        return;
      }

      const incoming: ExtendedMessage = {
        id: msg.message_id || msg.id,
        sender_id: msg.sender_id,
        receiver_id: user!.id,
        message:
          msg.message || `📷 ${msg.media_type === "image" ? "Photo" : "Video"}`,
        created_at: msg.created_at || new Date().toISOString(),
        is_read: false,
        sender_name: msg.sender_name,
        media_type: msg.media_type,
        file_path: `/api/media/${msg.message_id || msg.id}`,
        file_name: msg.file_name,
        file_size: msg.file_size,
      };

      setMessages((prev) => [...prev, incoming]);
      loadConversations();
    }

    // Handle typing indicator
    if (msg.type === "typing") {
      if (msg.sender_id !== currentFriendRef.current) return;
      setTypingUsers((prev) => [...new Set([...prev, msg.sender_id])]);
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== msg.sender_id));
      }, 3000);
    }

    // Handle read receipt
    if (msg.type === "message_read") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.message_id ? { ...m, is_read: true } : m,
        ),
      );
      loadConversations();
    }
  }, [lastMessage, user, loadConversations]);

  // Initialize
  useEffect(() => {
    isActiveRef.current = true;
    loadConversations();

    return () => {
      isActiveRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [loadConversations]);

  // URL param
  useEffect(() => {
    const friendId = searchParams.get("friend");
    if (friendId && !currentFriendId) {
      openChat(parseInt(friendId));
    }
  }, [searchParams]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing indicator handler
  const handleTyping = useCallback(() => {
    if (!isTyping && currentFriendId) {
      setIsTyping(true);
      sendWSMessage({
        type: "typing",
        receiver_id: currentFriendId,
        is_typing: true,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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
  }, [isTyping, currentFriendId, sendWSMessage]);

  // Open chat
  const openChat = useCallback(
    async (friendId: number) => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      setCurrentFriendId(friendId);
      currentFriendRef.current = friendId;
      setMessages([]);
      setReplyingTo(null);

      await loadMessages(friendId);

      pollIntervalRef.current = setInterval(() => {
        if (currentFriendRef.current === friendId && isActiveRef.current) {
          loadMessages(friendId);
        }
      }, 5000);
    },
    [loadMessages],
  );

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && !replyingTo) return;
    if (!currentFriendId) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");
    const replyToId = replyingTo?.id || null;
    setReplyingTo(null);

    try {
      const data = await api.post(
        "/api/messages",
        {
          receiver_id: currentFriendId,
          message: text,
          reply_to_id: replyToId,
        },
        true,
      );

      if (data && !data.error) {
        const optimistic: ExtendedMessage = {
          id: data.id ?? Date.now(),
          sender_id: user!.id,
          receiver_id: currentFriendId,
          message: text,
          created_at: new Date().toISOString(),
          is_read: false,
          sender_name: user!.name,
          is_replying_to: replyToId,
        };

        setMessages((prev) => [...prev, optimistic]);
        loadConversations();

        sendWSMessage({
          type: "new_message",
          receiver_id: currentFriendId,
          message: text,
          message_id: data.id,
          reply_to_id: replyToId,
        });
      } else {
        showError(data?.error || "Failed to send message");
        setNewMessage(text);
      }
    } catch (err) {
      console.error("Send message error:", err);
      showError("Failed to send message");
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  // Handle media upload complete
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

  // Filter conversations
  const filteredConversations = conversations.filter(
    (c) =>
      c.friend_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentConversation = conversations.find(
    (c) => c.friend_id === currentFriendId,
  );
  const currentFriendName = currentConversation?.friend_name || "User";

  // Format time
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">💬 Messages</h1>
        {!isConnected && (
          <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
            ⚡ Reconnecting...
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* SIDEBAR */}
        <div className="flex flex-col min-h-0">
          <input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 mb-3 rounded-xl bg-[#111118] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
          />

          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              <p className="text-gray-400 text-sm p-2">Loading...</p>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <button
                  key={conv.friend_id}
                  onClick={() => openChat(conv.friend_id)}
                  className={`w-full text-left p-3 rounded-xl transition ${
                    currentFriendId === conv.friend_id
                      ? "bg-indigo-500/10 border border-indigo-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {conv.friend_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm truncate">
                          {conv.friend_name}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-indigo-600 rounded-full text-xs text-white flex-shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {conv.last_message}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-sm p-2">No conversations yet</p>
            )}
          </div>
        </div>

        {/* CHAT PANEL */}
        <div className="md:col-span-2 flex flex-col min-h-0 bg-[#16161f] border border-white/10 rounded-xl overflow-hidden">
          {currentFriendId ? (
            <>
              {/* HEADER */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {currentFriendName[0].toUpperCase()}
                  </div>
                  <span className="font-semibold">{currentFriendName}</span>
                  {typingUsers.includes(currentFriendId) && (
                    <span className="text-xs text-indigo-400 ml-2 animate-pulse">
                      typing...
                    </span>
                  )}
                </div>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start a conversation!
                  </div>
                )}
                {messages.map((msg) => {
                  const isSent = msg.sender_id === user?.id;

                  return (
                    <div key={msg.id} className="group">
                      {/* Reply preview */}
                      {msg.is_replying_to && msg.reply_to_message && (
                        <div
                          className={`text-xs text-gray-400 mb-1 ${
                            isSent ? "text-right" : "text-left"
                          }`}
                        >
                          <span className="text-indigo-400">
                            ↩️ Replying to:
                          </span>{" "}
                          {msg.reply_to_message.message.substring(0, 50)}...
                        </div>
                      )}

                      <div
                        className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-[70%]">
                          {/* Media message */}
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
                            /* Text message */
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative ${
                                isSent
                                  ? "bg-indigo-600 text-white rounded-br-sm"
                                  : "bg-[#2a2a3a] text-gray-100 rounded-bl-sm"
                              }`}
                            >
                              {msg.message}
                            </div>
                          )}

                          {/* Message metadata */}
                          <div
                            className={`text-xs mt-1 flex items-center gap-2 ${
                              isSent ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-gray-500">
                              {formatTime(msg.created_at)}
                            </span>
                            {isSent && msg.is_read && (
                              <span className="text-indigo-400 text-xs flex items-center gap-1">
                                <span>✓✓</span> Read
                              </span>
                            )}
                            {isSent && !msg.is_read && (
                              <span className="text-gray-500 text-xs flex items-center gap-1">
                                <span>✓</span> Sent
                              </span>
                            )}
                          </div>

                          {/* Reply button */}
                          {!isSent && (
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="text-xs text-gray-500 hover:text-indigo-400 mt-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              ↩️ Reply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply indicator */}
              {replyingTo && (
                <div className="px-3 py-2 border-t border-white/10 bg-[#1a1a24] flex items-center justify-between">
                  <div className="text-sm flex-1">
                    <span className="text-indigo-400">↩️ Replying to:</span>
                    <span className="text-gray-400 ml-2">
                      {replyingTo.message.substring(0, 60)}...
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-500 hover:text-white ml-2 p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* INPUT */}
              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2 items-end">
                  {/* Media upload button */}
                  <MediaUpload
                    receiverId={currentFriendId}
                    onUploadComplete={handleMediaUploadComplete}
                    onError={showError}
                  />

                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#111118] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none text-sm"
                    placeholder="Type a message... (Enter to send)"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || (!newMessage.trim() && !replyingTo)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-500">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
