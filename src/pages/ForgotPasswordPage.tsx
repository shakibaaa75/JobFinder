// src/pages/ForgotPasswordPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const { success, error: showError } = useToast();

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendCode = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!email || !validateEmail(email)) {
      showError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const data = await api.post("/api/forgot-password", { email });
      if (data && !data.error) {
        setUserEmail(email);
        setStep(2);
        success("Reset code sent to your email!");
      } else {
        showError(data?.error || "Failed to send reset code");
      }
    } catch (error) {
      showError("Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!code || !/^\d{6}$/.test(code)) {
      showError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const data = await api.post("/api/verify-reset-code", {
        email: userEmail,
        code: code,
      });

      if (data && data.token) {
        success("Code verified! Redirecting...");
        setTimeout(() => {
          window.location.href = `/reset-password?token=${data.token}`;
        }, 1500);
      } else {
        showError(data?.error || "Invalid verification code");
      }
    } catch (error) {
      showError("Failed to verify code");
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
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email to receive a reset code
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">Enter code</h1>
              <p className="text-gray-500 text-sm mb-6">
                We sent a 6-digit code to{" "}
                <span className="text-white font-medium">{userEmail}</span>
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-[#111118] border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCode("");
                  }}
                  className="w-full py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition text-sm"
                >
                  ← Back to email
                </button>
              </form>
            </>
          )}

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

export default ForgotPasswordPage;
