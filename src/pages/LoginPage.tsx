// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const { error: showError, success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !password) {
      showError("Please enter both email and password");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      success("Welcome back!");
      navigate("/dashboard");
    } else {
      showError(result.error || "Login failed");
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
            Welcome
            <br />
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              back.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-md mb-12">
            Sign in to access your dashboard, manage your applications, and
            discover new opportunities.
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
          <h1 className="text-3xl font-bold mb-2">Sign in</h1>
          <p className="text-gray-500 mb-8">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 hover:text-indigo-400 transition"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-gray-500 text-sm">
              Don't have an account?{" "}
            </span>
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
