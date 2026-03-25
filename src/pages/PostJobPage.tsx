// src/pages/PostJobPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import type { JobFormData } from "../types";

const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const {} = useAuth();
  const { success, error: showError } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    salary: "",
    experience: "",
    description: "",
    requirements: "",
    benefits: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (): boolean => {
    if (currentStep === 1) {
      if (!formData.title || !formData.company || !formData.location) {
        showError("Please fill in Job Title, Company, and Location.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.description) {
        showError("Please add a job description.");
        return false;
      }
    }
    return true;
  };

  const goToStep = (step: number): void => {
    if (step > currentStep && !validateStep()) return;
    setCurrentStep(step);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post("/api/jobs", formData, true);
      if (data && !data.error) {
        success("Job posted successfully!");
        setTimeout(() => navigate("/jobs"), 1500);
      } else {
        showError(data?.error || "Failed to post job");
      }
    } catch (error) {
      showError("Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["", "Basic Info", "Description", "Preview & Publish"];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-indigo-400 text-sm font-bold tracking-wider mb-2">
          ● For Employers
        </p>
        <h1 className="text-3xl font-bold mb-2">
          Post a{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Job Listing
          </span>
        </h1>
        <p className="text-gray-500">
          Reach thousands of qualified candidates. Fill your role faster.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-6">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <button
                    onClick={() => goToStep(step)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                      currentStep >= step
                        ? "bg-indigo-600 text-white"
                        : "bg-[#111118] text-gray-500 border border-white/10"
                    }`}
                  >
                    {step}
                  </button>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-0.5 rounded-full transition ${
                        currentStep > step ? "bg-indigo-600" : "bg-white/10"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
              <span className="text-sm text-gray-500 ml-2">
                {stepLabels[currentStep]}
              </span>
            </div>

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Remote, New York..."
                      className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Job Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="e.g. $80k – $110k / yr"
                      className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Experience Level
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Any</option>
                      <option value="Entry-level">Entry-level</option>
                      <option value="Mid-level">Mid-level</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead / Manager">Lead / Manager</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => goToStep(2)}
                  className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition"
                >
                  Next: Description →
                </button>
              </div>
            )}

            {/* Step 2: Description */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Describe the role, responsibilities, team culture..."
                    className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.description ?? "").length} / 2000 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Requirements
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Required skills, qualifications, experience..."
                    className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Benefits (optional)
                  </label>
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Health insurance, remote work, equity..."
                    className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep(1)}
                    className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => goToStep(3)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition"
                  >
                    Next: Preview →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {currentStep === 3 && (
              <div>
                <h3 className="text-lg font-bold mb-4">Preview your listing</h3>
                <div className="bg-[#111118] border border-white/10 rounded-xl p-5 mb-6">
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">
                      {formData.type}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      {formData.location?.toLowerCase().includes("remote")
                        ? "🌍 Remote"
                        : `📍 ${formData.location}`}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">
                    {formData.title || "Job Title"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {formData.company || "Company"} •{" "}
                    {formData.salary || "Competitive"}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {(formData.description || "").substring(0, 220)}
                    {(formData.description ?? "").substring(0, 220)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep(2)}
                    className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition"
                  >
                    ← Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50"
                  >
                    {loading ? "Publishing..." : "🚀 Publish Job"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Sidebar */}
        <div>
          <div className="bg-[#16161f] border border-white/10 rounded-xl p-5 sticky top-24">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              💡 Tips for success
            </h4>
            <div className="space-y-4">
              <div>
                <strong className="text-white text-sm block mb-1">
                  Be specific
                </strong>
                <p className="text-gray-500 text-xs">
                  Clear titles and descriptions attract better candidates.
                </p>
              </div>
              <div className="border-t border-white/10" />
              <div>
                <strong className="text-white text-sm block mb-1">
                  Include salary
                </strong>
                <p className="text-gray-500 text-xs">
                  Listings with salary info get 40% more applicants.
                </p>
              </div>
              <div className="border-t border-white/10" />
              <div>
                <strong className="text-white text-sm block mb-1">
                  List benefits
                </strong>
                <p className="text-gray-500 text-xs">
                  Highlight perks — remote work, equity, health coverage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJobPage;
