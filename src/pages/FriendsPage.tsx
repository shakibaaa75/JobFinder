// src/pages/FriendsPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import type { Friend, FriendRequest } from "../types";

type TabType = "search" | "friends" | "requests" | "sent";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  headline?: string;
  location?: string;
  friend_status?: string;
}

const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("search");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async (): Promise<void> => {
    setLoading(true);
    await Promise.all([
      loadFriends(),
      loadRequests("received"),
      loadRequests("sent"),
    ]);
    setLoading(false);
  };

  const searchUsers = async (): Promise<void> => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await api.get<User[]>(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        true,
      );
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const loadFriends = async (): Promise<void> => {
    try {
      const data = await api.get<Friend[]>("/api/friends", true);
      setFriends(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  };

  const loadRequests = async (type: "received" | "sent"): Promise<void> => {
    try {
      const data = await api.get<FriendRequest[]>(
        `/api/friends/requests?type=${type}`,
        true,
      );
      if (type === "received") {
        setFriendRequests(Array.isArray(data) ? data : []);
      } else {
        setSentRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(`Failed to load ${type} requests:`, error);
    }
  };

  const sendFriendRequest = async (friendId: number): Promise<void> => {
    try {
      const data = await api.post(
        "/api/friends/request",
        { friend_id: friendId },
        true,
      );
      if (data && !data.error) {
        success("Friend request sent!");
        searchUsers(); // Refresh search results
      } else {
        showError(data?.error || "Failed to send request");
      }
    } catch (error) {
      showError("Failed to send request");
    }
  };

  const respondToRequest = async (
    requestId: number,
    action: "accept" | "reject",
  ): Promise<void> => {
    try {
      const data = await api.put(
        `/api/friends/requests/${requestId}`,
        { action },
        true,
      );
      if (data && !data.error) {
        success(`Friend request ${action}ed!`);
        loadRequests("received");
        if (action === "accept") loadFriends();
      } else {
        showError(data?.error || `Failed to ${action} request`);
      }
    } catch (error) {
      showError(`Failed to ${action} request`);
    }
  };

  const cancelRequest = async (requestId: number): Promise<void> => {
    if (!confirm("Cancel this friend request?")) return;

    try {
      const data = await api.delete(`/api/friends/${requestId}`, true);
      if (data && !data.error) {
        success("Request cancelled");
        loadRequests("sent");
      } else {
        showError("Failed to cancel request");
      }
    } catch (error) {
      showError("Failed to cancel request");
    }
  };

  const removeFriend = async (
    friendshipId: number,
    friendName: string,
  ): Promise<void> => {
    if (!confirm(`Remove ${friendName} from your friends?`)) return;

    try {
      const data = await api.delete(`/api/friends/${friendshipId}`, true);
      if (data && !data.error) {
        success("Friend removed");
        loadFriends();
      } else {
        showError("Failed to remove friend");
      }
    } catch (error) {
      showError("Failed to remove friend");
    }
  };

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "Today";
    if (days < 7) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-indigo-400 text-sm font-bold tracking-wider mb-2">
          ● Social Network
        </p>
        <h1 className="text-3xl font-bold mb-2">
          Your{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Friends
          </span>
        </h1>
        <p className="text-gray-500">
          Connect with colleagues and expand your network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div>
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-5 sticky top-24">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <div className="space-y-2">
              {[
                { id: "search", label: "🔍 Search Users", icon: "🔍" },
                {
                  id: "friends",
                  label: "👥 My Friends",
                  icon: "👥",
                  count: friends.length,
                },
                {
                  id: "requests",
                  label: "📨 Requests",
                  icon: "📨",
                  count: friendRequests.length,
                },
                {
                  id: "sent",
                  label: "📤 Sent Requests",
                  icon: "📤",
                  count: sentRequests.length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                    activeTab === tab.id
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count && tab.count > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-600 rounded-full text-xs text-white">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5 mt-4">
            <p className="text-indigo-400 text-xs font-bold mb-2">💡 Tip</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Connect with other professionals to chat, share opportunities, and
              grow your network!
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search Tab */}
          {activeTab === "search" && (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="m21 21-4.35-4.35" strokeWidth="2" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name, email, or headline..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyUp={() => setTimeout(searchUsers, 300)}
                    className="w-full pl-11 pr-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {searching ? (
                  Array(3)
                    .fill(null)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-[#16161f] border border-white/10 rounded-xl p-4 animate-pulse"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
                            <div className="h-3 w-48 bg-gray-700 rounded" />
                          </div>
                        </div>
                      </div>
                    ))
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => {
                    const status = user.friend_status || "none";
                    return (
                      <div
                        key={user.id}
                        className="bg-[#16161f] border border-white/10 rounded-xl p-4 hover:border-indigo-500/40 transition"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {user.name[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">
                                {user.headline || user.role || "User"}
                              </div>
                              {user.location && (
                                <div className="text-xs text-gray-600 mt-1">
                                  📍 {user.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            {status === "none" && (
                              <button
                                onClick={() => sendFriendRequest(user.id)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition"
                              >
                                Add Friend
                              </button>
                            )}
                            {status === "sent" && (
                              <button className="px-4 py-2 border border-white/10 rounded-lg text-gray-500 text-sm cursor-default">
                                Request Sent
                              </button>
                            )}
                            {status === "received" && (
                              <button
                                onClick={() => setActiveTab("requests")}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm font-medium transition"
                              >
                                View Request
                              </button>
                            )}
                            {status === "accepted" && (
                              <div className="flex gap-2">
                                <Link
                                  to={`/messages?friend=${user.id}`}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition"
                                >
                                  Message
                                </Link>
                                <button className="px-4 py-2 border border-white/10 rounded-lg text-gray-500 text-sm cursor-default">
                                  Friends
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">😕</div>
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🔍</div>
                    <p className="text-gray-500">
                      Enter at least 2 characters to search
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === "friends" && (
            <div>
              <h2 className="text-xl font-bold mb-4">My Friends</h2>
              <div className="space-y-3">
                {loading ? (
                  Array(3)
                    .fill(null)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-[#16161f] border border-white/10 rounded-xl p-4 animate-pulse"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
                            <div className="h-3 w-48 bg-gray-700 rounded" />
                          </div>
                        </div>
                      </div>
                    ))
                ) : friends.length > 0 ? (
                  friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-[#16161f] border border-white/10 rounded-xl p-4 hover:border-indigo-500/40 transition"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {friend.friend_name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">
                              {friend.friend_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {friend.friend_bio ||
                                friend.friend_role ||
                                "User"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/messages?friend=${friend.friend_id}`}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition"
                          >
                            Message
                          </Link>
                          <button
                            onClick={() =>
                              removeFriend(friend.id, friend.friend_name)
                            }
                            className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-400/30 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">👥</div>
                    <p className="text-gray-500 mb-3">No friends yet</p>
                    <button
                      onClick={() => setActiveTab("search")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition"
                    >
                      Search Users
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === "requests" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Friend Requests</h2>
              <div className="space-y-3">
                {loading ? (
                  Array(2)
                    .fill(null)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-[#16161f] border border-white/10 rounded-xl p-4 animate-pulse"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
                            <div className="h-3 w-48 bg-gray-700 rounded" />
                          </div>
                        </div>
                      </div>
                    ))
                ) : friendRequests.length > 0 ? (
                  friendRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#16161f] border border-white/10 rounded-xl p-4 hover:border-indigo-500/40 transition"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {req.friend_name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{req.friend_name}</div>
                            <div className="text-sm text-gray-500">
                              {req.friend_bio || req.friend_role || "User"}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Sent {timeAgo(req.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToRequest(req.id, "accept")}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => respondToRequest(req.id, "reject")}
                            className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-400/30 transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-gray-500">No pending requests</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sent Requests Tab */}
          {activeTab === "sent" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Sent Requests</h2>
              <div className="space-y-3">
                {loading ? (
                  Array(2)
                    .fill(null)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-[#16161f] border border-white/10 rounded-xl p-4 animate-pulse"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
                            <div className="h-3 w-48 bg-gray-700 rounded" />
                          </div>
                        </div>
                      </div>
                    ))
                ) : sentRequests.length > 0 ? (
                  sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#16161f] border border-white/10 rounded-xl p-4 hover:border-indigo-500/40 transition"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {req.friend_name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{req.friend_name}</div>
                            <div className="text-sm text-gray-500">
                              {req.friend_bio || req.friend_role || "User"}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Sent {timeAgo(req.created_at)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => cancelRequest(req.id)}
                          className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-400/30 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">📤</div>
                    <p className="text-gray-500">No sent requests</p>
                    <button
                      onClick={() => setActiveTab("search")}
                      className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition"
                    >
                      Find Friends
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
