// src/pages/JobsPage.tsx
import React, { useState, useEffect } from "react";
import JobCard from "../components/JobCard";
import SkeletonCard from "../components/SkeletonCard";
import api from "../services/api";
import type { Job } from "../types";

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [jobType, setJobType] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const jobsPerPage = 12;

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
    setCurrentPage(1);
    fetchJobs();
  };

  const clearFilters = (): void => {
    setSearchTerm("");
    setLocation("");
    setJobType("");
    setSortBy("newest");
    setCurrentPage(1);
    fetchJobs();
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "newest") {
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    }
    if (sortBy === "oldest") {
      return (
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime()
      );
    }
    if (sortBy === "company") {
      return (a.company || "").localeCompare(b.company || "");
    }
    return 0;
  });

  const paginatedJobs = sortedJobs.slice(0, currentPage * jobsPerPage);
  const hasMore = paginatedJobs.length < sortedJobs.length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Find your{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            dream job
          </span>
        </h1>
        <p className="text-gray-500">
          Browse thousands of opportunities from the world's best companies
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-[#16161f] border border-white/10 rounded-xl p-6 mb-8">
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4"
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
              placeholder="Search by title, company, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 md:w-40"
          >
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="San Francisco">San Francisco</option>
            <option value="London">London</option>
            <option value="New York">New York</option>
          </select>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 md:w-36"
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition"
          >
            Clear
          </button>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="font-bold text-white">{sortedJobs.length}</span>
          <span className="text-gray-500"> jobs found</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-[#111118] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="company">Company</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6)
            .fill(null)
            .map((_, i) => <SkeletonCard key={i} />)
        ) : paginatedJobs.length > 0 ? (
          paginatedJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Load More */}
      {!loading && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition"
          >
            Load More Jobs
          </button>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
