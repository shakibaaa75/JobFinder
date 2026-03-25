// src/pages/UserProfilePage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  twitter?: string;
  friend_status: "none" | "sent" | "received" | "accepted" | "blocked";
}

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingRequest, setSendingRequest] = useState<boolean>(false);

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async (): Promise<void> => {
    try {
      const data = await api.get<UserProfile>(`/api/users/${id}`, true);
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      showError("User not found");
      navigate("/friends");
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (): Promise<void> => {
    if (!profile) return;
    setSendingRequest(true);
    try {
      const data = await api.post(
        "/api/friends/request",
        { friend_id: profile.id },
        true,
      );
      if (data && !data.error) {
        success("Friend request sent!");
        setProfile({ ...profile, friend_status: "sent" });
      } else {
        showError(data?.error || "Failed to send request");
      }
    } catch (error) {
      showError("Failed to send request");
    } finally {
      setSendingRequest(false);
    }
  };

  const respondToRequest = async (
    action: "accept" | "reject",
  ): Promise<void> => {
    if (!profile) return;

    // Need to find the request ID first
    try {
      const requests = await api.get<any[]>(
        `/api/friends/requests?type=received`,
        true,
      );
      const request = requests.find((r) => r.user_id === profile.id);

      if (request) {
        const data = await api.put(
          `/api/friends/requests/${request.id}`,
          { action },
          true,
        );
        if (data && !data.error) {
          success(`Friend request ${action}ed!`);
          setProfile({
            ...profile,
            friend_status: action === "accept" ? "accepted" : "none",
          });
        } else {
          showError(data?.error || `Failed to ${action} request`);
        }
      }
    } catch (error) {
      showError(`Failed to ${action} request`);
    }
  };

  const removeFriend = async (): Promise<void> => {
    if (!profile) return;

    if (!confirm(`Remove ${profile.name} from your friends?`)) return;

    try {
      const friends = await api.get<any[]>("/api/friends", true);
      const friendship = friends.find((f) => f.friend_id === profile.id);

      if (friendship) {
        const data = await api.delete(`/api/friends/${friendship.id}`, true);
        if (data && !data.error) {
          success("Friend removed");
          setProfile({ ...profile, friend_status: "none" });
        } else {
          showError("Failed to remove friend");
        }
      }
    } catch (error) {
      showError("Failed to remove friend");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
        <div className="h-32 bg-gray-700 rounded-xl mb-6" />
        <div className="h-8 w-48 bg-gray-700 rounded mb-4" />
        <div className="h-4 w-64 bg-gray-700 rounded" />
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === profile.id;
  const skillsList =
    profile.skills
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 hover:text-white mb-6 flex items-center gap-2"
      >
        ← Back
      </button>

      {/* Profile Header */}
      <div className="bg-[#16161f] border border-white/10 rounded-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {profile.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
                <p className="text-indigo-400 text-sm mb-2">
                  {profile.role === "employer"
                    ? "🏢 Employer"
                    : "👤 Job Seeker"}
                </p>
                {profile.headline && (
                  <p className="text-gray-400">{profile.headline}</p>
                )}
              </div>
              <div>
                {!isOwnProfile && (
                  <>
                    {profile.friend_status === "none" && (
                      <button
                        onClick={sendFriendRequest}
                        disabled={sendingRequest}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition disabled:opacity-50"
                      >
                        {sendingRequest ? "Sending..." : "➕ Add Friend"}
                      </button>
                    )}
                    {profile.friend_status === "sent" && (
                      <button className="px-5 py-2 border border-white/10 rounded-lg text-gray-500 cursor-default">
                        ⏳ Request Sent
                      </button>
                    )}
                    {profile.friend_status === "received" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => respondToRequest("accept")}
                          className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondToRequest("reject")}
                          className="px-5 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-red-400 transition"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {profile.friend_status === "accepted" && (
                      <div className="flex gap-2">
                        <Link
                          to={`/messages?friend=${profile.id}`}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition"
                        >
                          💬 Message
                        </Link>
                        <button
                          onClick={removeFriend}
                          className="px-5 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-red-400 transition"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Bio */}
          {profile.bio && (
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3">About</h3>
              <p className="text-gray-400 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {skillsList.length > 0 && (
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="space-y-4">
          {/* Contact Info */}
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Contact & Location</h3>
            <div className="space-y-3">
              {profile.location && (
                <div className="flex items-center gap-2 text-gray-400">
                  <span>📍</span>
                  <span>{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-400">
                <span>📧</span>
                <span>{profile.email}</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {(profile.linkedin ||
            profile.github ||
            profile.website ||
            profile.twitter) && (
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Social Links</h3>
              <div className="space-y-2">
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    🔗 LinkedIn
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    💻 GitHub
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    🌐 Website
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={profile.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    🐦 Twitter/X
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
