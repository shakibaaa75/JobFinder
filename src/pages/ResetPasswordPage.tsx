// src/pages/ResetPasswordPage.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (!resetToken) {
      showError("Invalid or missing reset session");
      setTimeout(() => navigate("/forgot-password"), 2000);
    } else {
      setToken(resetToken);
    }
  }, [searchParams, navigate, showError]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (password.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await api.post("/api/reset-password", {
        token: token,
        new_password: password,
      });

      if (data && !data.error) {
        success("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login?reset=success");
        }, 2000);
      } else {
        showError(data?.error || "Failed to reset password");
      }
    } catch (error) {
      showError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#0a0a0f]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="font-bold text-xl text-white">GoJobBoard</span>
          </Link>
        </div>

        <div className="bg-[#16161f] border border-white/10 rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-2">Create new password</h1>
          <p className="text-gray-500 text-sm mb-6">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-sm text-gray-500 hover:text-indigo-400 transition"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
