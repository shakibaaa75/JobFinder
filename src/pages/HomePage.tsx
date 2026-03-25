// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import JobCard from "../components/JobCard";
import SkeletonCard from "../components/SkeletonCard";
import api from "../services/api";
import type { Job } from "../types";

const HomePage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [jobType] = useState<string>("");
  const {} = useAuth();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (location) params.append("location", location);
      if (jobType) params.append("type", jobType);

      const data = await api.get<Job[]>(`/api/jobs?${params.toString()}`);
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 mb-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative text-center max-w-2xl mx-auto">
          <p className="text-indigo-400 text-sm font-bold tracking-wider mb-3">
            ● LIVE OPPORTUNITIES
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find your next{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              great role.
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Thousands of opportunities from top companies. Remote, hybrid, or
            on-site — your call.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 relative">
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
                placeholder="Job title, keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 sm:w-40"
            >
              <option value="">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="Onsite">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-8 justify-center border-y border-white/10 py-6 mb-12">
        <div className="text-center">
          <span className="text-2xl font-bold text-indigo-400">
            {jobs.length}
          </span>
          <span className="text-gray-500 ml-2">jobs listed</span>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-white">100+</span>
          <span className="text-gray-500 ml-2">companies hiring</span>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-white">24/7</span>
          <span className="text-gray-500 ml-2">always updated</span>
        </div>
      </div>

      {/* Jobs Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Latest Jobs</h2>
          <Link
            to="/jobs"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            Array(4)
              .fill(null)
              .map((_, i) => <SkeletonCard key={i} />)
          ) : jobs.length > 0 ? (
            jobs.slice(0, 6).map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-gray-500">
                Try different keywords or clear your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
