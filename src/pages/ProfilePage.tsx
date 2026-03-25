// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import type { ProfileFormData } from "../types";

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    bio: "",
    skills: "",
    linkedin: "",
    github: "",
    website: "",
    twitter: "",
    current_password: "",
    new_password: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        headline: user.headline || "",
        bio: user.bio || "",
        skills: user.skills || "",
        linkedin: user.linkedin || "",
        github: user.github || "",
        website: user.website || "",
        twitter: user.twitter || "",
        current_password: "",
        new_password: "",
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      showError("Name and email are required.");
      return;
    }

    if (!validateEmail(formData.email)) {
      showError("Please enter a valid email address.");
      return;
    }

    // Password validation if changing
    if (formData.current_password || formData.new_password) {
      if (!formData.current_password) {
        showError("Please enter your current password.");
        return;
      }
      if (formData.new_password.length < 8) {
        showError("New password must be at least 8 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      const data = await api.put("/api/users/me", formData, true);
      if (data && !data.error) {
        updateUser({ name: formData.name, email: formData.email });
        success("Profile updated successfully!");

        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          current_password: "",
          new_password: "",
        }));

        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        showError(data?.error || "Failed to update profile");
      }
    } catch (error) {
      showError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getProfileStrength = (): number => {
    let filled = 0;
    const fields = [
      "name",
      "email",
      "phone",
      "location",
      "headline",
      "bio",
      "skills",
    ];
    fields.forEach((field) => {
      if (formData[field as keyof ProfileFormData]) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  };

  const profileStrength = getProfileStrength();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-indigo-400 text-sm font-bold tracking-wider mb-2">
          ● My Profile
        </p>
        <h1 className="text-3xl font-bold mb-2">
          Edit Your{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Profile
          </span>
        </h1>
        <p className="text-gray-500">
          Update your information to stand out to employers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📋 Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="San Francisco, CA"
                    className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Job Title / Headline
                </label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* About */}
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">✍️ About You</h3>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell employers about yourself, your experience, what you're looking for..."
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length} / 1000 characters
                </p>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">🎯 Skills & Expertise</h3>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Your Skills (comma-separated)
                </label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g., JavaScript, React, Node.js, Python, Project Management"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.skills.split(",").map(
                    (skill, i) =>
                      skill.trim() && (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-400"
                        >
                          {skill.trim()}
                        </span>
                      ),
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">
                🔗 Social & Portfolio Links
              </h3>
              <div className="space-y-3">
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="🔗 LinkedIn Profile"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  placeholder="💻 GitHub Profile"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="🌐 Personal Website / Portfolio"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="🐦 Twitter / X Profile"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">🔒 Change Password</h3>
              <div className="space-y-3">
                <input
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  placeholder="Current Password"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder="New Password (min. 8 characters)"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "💾 Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div>
          {/* Profile Preview */}
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-5 mb-4 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {(formData.name || "U")[0].toUpperCase()}
            </div>
            <h4 className="font-bold text-lg">
              {formData.name || "Your Name"}
            </h4>
            <p className="text-gray-500 text-sm">
              {formData.email || "your@email.com"}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {formData.headline || "Add a job title or headline"}
            </p>
          </div>

          {/* Profile Strength */}
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-5">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Profile Strength
            </h4>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-400">{profileStrength}%</span>
              <span className="text-gray-500">Complete</span>
            </div>
            <div className="h-2 bg-[#111118] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {profileStrength < 50
                ? "Complete your profile to get noticed by employers"
                : profileStrength < 80
                  ? "Great progress! Add more details to stand out"
                  : "Excellent profile! You're ready to impress employers"}
            </p>
          </div>

          {/* Tips */}
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-5 mt-4">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              💡 Profile Tips
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div>
                <strong className="text-white block mb-1">
                  Complete your profile
                </strong>
                <p>
                  Profiles with all fields filled get 3x more views from
                  employers.
                </p>
              </div>
              <div className="border-t border-white/10" />
              <div>
                <strong className="text-white block mb-1">
                  Add relevant skills
                </strong>
                <p>List skills that match the jobs you're interested in.</p>
              </div>
              <div className="border-t border-white/10" />
              <div>
                <strong className="text-white block mb-1">
                  Link your work
                </strong>
                <p>
                  Add your GitHub, LinkedIn, or portfolio to showcase your
                  projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
