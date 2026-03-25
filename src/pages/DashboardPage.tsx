// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import type { Application } from "../types";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async (): Promise<void> => {
    try {
      const data = await api.get<Application[]>("/api/applications/my", true);
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-400",
      reviewed: "bg-indigo-500/20 text-indigo-400",
      accepted: "bg-green-500/20 text-green-400", // ✅ Changed from 'interview' to 'accepted'
      rejected: "bg-red-500/20 text-red-400",
    };
    return classes[status] || "bg-gray-500/20 text-gray-400";
  };

  const getStatusDot = (status: string): string => {
    const dots: Record<string, string> = {
      pending: "●",
      reviewed: "◉",
      accepted: "✔", // ✅ Changed from 'interview' to 'accepted'
      rejected: "✕",
    };
    return dots[status] || "○";
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: "Pending",
      reviewed: "Reviewed",
      accepted: "Accepted", // ✅ Changed from 'interview' to 'accepted'
      rejected: "Rejected",
    };
    return labels[status] || status;
  };

  const filteredApps = statusFilter
    ? applications.filter((app) => app.status === statusFilter)
    : applications;

  const stats = {
    applied: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length, // ✅ Changed from 'interview'
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const firstName = user?.name?.split(" ")[0] || "there";

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
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <p className="text-indigo-400 text-sm font-bold tracking-wider mb-2">
          ● My Dashboard
        </p>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {firstName}
              </span>{" "}
              👋
            </h1>
            <p className="text-gray-500">
              Here's an overview of your job search activity.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/jobs"
              className="px-4 py-2 border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-white/20 transition"
            >
              Browse Jobs
            </Link>
            <Link
              to="/post-job"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition"
            >
              + Post a Job
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#16161f] border border-white/10 rounded-xl p-5">
          <div className="text-3xl font-bold text-indigo-400">
            {stats.applied}
          </div>
          <div className="text-gray-500 text-sm mt-1">Total Applied</div>
        </div>
        <div className="bg-[#16161f] border border-white/10 rounded-xl p-5">
          <div className="text-3xl font-bold text-amber-400">
            {stats.pending}
          </div>
          <div className="text-gray-500 text-sm mt-1">Pending Review</div>
        </div>
        <div className="bg-[#16161f] border border-white/10 rounded-xl p-5">
          <div className="text-3xl font-bold text-indigo-400">
            {stats.reviewed}
          </div>
          <div className="text-gray-500 text-sm mt-1">Reviewed</div>
        </div>
        <div className="bg-[#16161f] border border-white/10 rounded-xl p-5">
          <div className="text-3xl font-bold text-green-400">
            {stats.accepted}
          </div>
          <div className="text-gray-500 text-sm mt-1">Accepted</div>
        </div>
      </div>

      {/* Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-bold">My Applications</h2>
              <p className="text-gray-500 text-sm">
                Your recent job applications
              </p>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#111118] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array(3)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#16161f] border border-white/10 rounded-xl p-5 animate-pulse"
                  >
                    <div className="h-5 w-48 bg-gray-700 rounded mb-2" />
                    <div className="h-4 w-32 bg-gray-700 rounded" />
                  </div>
                ))
            ) : filteredApps.length > 0 ? (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-[#16161f] border border-white/10 rounded-xl p-5 hover:border-indigo-500/40 transition"
                >
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">
                        {app.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>🏢 {app.company}</span>
                        {app.applied_at && (
                          <span>{timeAgo(app.applied_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(app.status)}`}
                      >
                        {getStatusDot(app.status)} {getStatusLabel(app.status)}
                      </span>
                      <Link
                        to={`/jobs/${app.job_id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">
                  No applications yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start browsing jobs and apply to kick off your search.
                </p>
                <Link
                  to="/jobs"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium inline-block"
                >
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Profile Card */}
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-5 mb-4">
            <Link to="/profile" className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {(user?.name || "U")[0].toUpperCase()}
              </div>
              <div>
                <div className="font-bold">{user?.name || "Loading..."}</div>
                <div className="text-gray-500 text-sm">
                  {user?.email || "—"}
                </div>
              </div>
            </Link>
            <Link
              to="/profile"
              className="block w-full text-center py-2 border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-white/20 transition"
            >
              Edit Profile
            </Link>
          </div>

          {/* Quick Links */}
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-5">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <Link
                to="/jobs"
                className="block py-2 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                🔍 Browse new jobs
              </Link>
              <Link
                to="/post-job"
                className="block py-2 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                📝 Post a job
              </Link>
              <Link
                to="/profile"
                className="block py-2 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                📄 Update profile
              </Link>
              <Link
                to="/friends"
                className="block py-2 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                👥 Find friends
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
