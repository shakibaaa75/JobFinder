// src/components/JobCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import type { Job } from "../types";

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const isRemote = job.location?.toLowerCase().includes("remote");
  const typeColors: Record<string, string> = {
    "Full-time": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Part-time": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Contract: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Internship: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  const typeColor =
    typeColors[job.type] || "bg-gray-500/20 text-gray-400 border-gray-500/30";

  const timeAgo = (dateStr?: string): string => {
    if (!dateStr) return "Recently posted";
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
    <Link to={`/jobs/${job.id}`}>
      <div className="group bg-[#16161f] border border-white/10 rounded-xl p-6 transition-all hover:border-indigo-500/40 hover:translate-x-1 hover:shadow-lg">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 flex-wrap mb-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${typeColor}`}
              >
                {job.type || "Full-time"}
              </span>
              {isRemote ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  🌍 Remote
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                  📍 {job.location}
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-white truncate mb-1">
              {job.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
              <span>🏢 {job.company}</span>
              {job.salary && <span>💰 {job.salary}</span>}
              {job.experience && <span>⚡ {job.experience}</span>}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {(job.company || "J")[0].toUpperCase()}
          </div>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4">
          {job.description || "No description available"}
        </p>
        <div className="flex justify-between items-center pt-3 border-t border-white/10">
          <span className="text-xs text-gray-500">
            {timeAgo(job.created_at)}
          </span>
          <span className="text-sm text-indigo-400 font-medium group-hover:translate-x-1 transition">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
