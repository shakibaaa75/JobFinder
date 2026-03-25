// src/pages/JobDetailsPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import type { Job } from "../types";

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("description");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applying, setApplying] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async (): Promise<void> => {
    try {
      const data = await api.get<Job>(`/api/jobs/${id}`);
      if (data) {
        setJob(data);
      } else {
        navigate("/jobs");
      }
    } catch (error) {
      console.error("Failed to fetch job:", error);
      navigate("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleApply = async (): Promise<void> => {
    if (!isAuthenticated) {
      showError("Please sign in to apply");
      setTimeout(() => navigate("/login"), 1000);
      return;
    }

    if (!resumeFile) {
      showError("Please upload your resume");
      return;
    }

    setApplying(true);
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_id", id || "");

    try {
      const data = await api.post("/api/applications", formData, true);
      if (data && !data.error) {
        success("Application submitted successfully!");
        setApplied(true);
      } else {
        showError(data?.error || "Failed to submit application");
      }
    } catch (error) {
      showError("Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
        <div className="h-8 w-3/4 bg-gray-700 rounded mb-4" />
        <div className="h-4 w-1/2 bg-gray-700 rounded mb-6" />
        <div className="space-y-3">
          <div className="h-20 bg-gray-700 rounded" />
          <div className="h-20 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!job) return null;

  const isRemote = job.location?.toLowerCase().includes("remote");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/jobs" className="hover:text-indigo-400">
          Browse Jobs
        </Link>
        <span className="mx-2">→</span>
        <span className="text-white">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
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
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                ✦ Active
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm flex-wrap">
              <span>🏢 {job.company}</span>
              {job.salary && <span>💰 {job.salary}</span>}
              {job.created_at && <span>{timeAgo(job.created_at)}</span>}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/10 mb-6">
            {["description", "requirements", "benefits"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "text-indigo-400 border-b-2 border-indigo-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="text-gray-300 leading-relaxed">
            {activeTab === "description" &&
              (job.description || <p>No description provided.</p>)}
            {activeTab === "requirements" &&
              (job.requirements || <p>Requirements not specified.</p>)}
            {activeTab === "benefits" &&
              (job.benefits || <p>Benefits not specified.</p>)}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-6 sticky top-24">
            <h3 className="font-bold mb-2">Apply for this role</h3>
            <p className="text-gray-500 text-sm mb-5">
              Upload your resume and submit
            </p>

            {!applied ? (
              <>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition mb-4">
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer block">
                    <svg
                      className="w-6 h-6 mx-auto mb-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                        strokeWidth="1.5"
                      />
                      <polyline points="17 8 12 3 7 8" strokeWidth="1.5" />
                      <line x1="12" y1="3" x2="12" y2="15" strokeWidth="1.5" />
                    </svg>
                    <p className="text-sm font-medium">
                      {resumeFile ? resumeFile.name : "Click to upload resume"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC up to 5MB
                    </p>
                  </label>
                </div>

                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50"
                >
                  {applying ? "Submitting..." : "Submit Application"}
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <h4 className="font-bold mb-2">Application submitted!</h4>
                <p className="text-sm text-gray-500">
                  Track it in your{" "}
                  <Link
                    to="/dashboard"
                    className="text-indigo-400 hover:underline"
                  >
                    dashboard
                  </Link>
                </p>
              </div>
            )}

            {!isAuthenticated && (
              <p className="text-xs text-gray-500 text-center mt-4">
                You must be{" "}
                <Link to="/login" className="text-indigo-400">
                  signed in
                </Link>{" "}
                to apply
              </p>
            )}
          </div>

          {/* Job Info */}
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-5 mt-4">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Job Info
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">📍 Location</span>
                <span className="text-white text-sm font-medium">
                  {job.location || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">💼 Type</span>
                <span className="text-white text-sm font-medium">
                  {job.type || "Full-time"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">🏢 Company</span>
                <span className="text-white text-sm font-medium">
                  {job.company}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">💰 Salary</span>
                <span className="text-white text-sm font-medium">
                  {job.salary || "Competitive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
