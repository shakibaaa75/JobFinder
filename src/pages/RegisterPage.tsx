// src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { RegisterData } from "../types";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<
    RegisterData & {
      confirmPassword: string;
      firstName: string;
      lastName: string;
    }
  >({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "jobseeker",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const { register } = useAuth();
  const { error: showError, success } = useToast();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword, role } =
      formData;

    if (!firstName || !lastName) {
      showError("First and last name are required");
      return;
    }
    if (!validateEmail(email)) {
      showError("Please enter a valid email address");
      return;
    }
    if (password.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await register({
      name: `${firstName} ${lastName}`,
      email,
      password,
      role,
    });
    setLoading(false);

    if (result.success) {
      success("Account created successfully!");
      navigate("/dashboard");
    } else {
      showError(result.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0d0d18] to-[#14142a] relative overflow-hidden p-12 flex-col justify-center">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-16">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="font-bold text-xl text-white">GoJobBoard</span>
          </Link>
          <h2 className="text-4xl font-bold mb-4">
            Start your
            <br />
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              career journey
            </span>
            <br />
            today.
          </h2>
          <p className="text-gray-400 text-lg max-w-md mb-12">
            Join thousands of professionals finding their dream roles every day
            on GoJobBoard.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                A
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                B
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs">
                C
              </div>
            </div>
            <span className="text-sm text-gray-500">
              <strong className="text-white">2,400+</strong> hired this month
            </span>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2">Create account</h1>
          <p className="text-gray-500 mb-8">
            Fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                I am a...
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="jobseeker">Job Seeker</option>
                <option value="employer">Employer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50 mt-4"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-gray-500 text-sm">
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
