// src/components/Navbar.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-bold text-xl text-white">GoJobBoard</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/jobs"
            className="text-gray-400 hover:text-white transition"
          >
            Browse Jobs
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/post-job"
                className="text-gray-400 hover:text-white transition"
              >
                Post a Job
              </Link>
              <Link
                to="/dashboard"
                className="text-gray-400 hover:text-white transition"
              >
                Dashboard
              </Link>
              <Link
                to="/messages"
                className="text-gray-400 hover:text-white transition"
              >
                Messages
              </Link>
              <Link
                to="/friends"
                className="text-gray-400 hover:text-white transition"
              >
                Friends
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to={`/user/${user?.id}`}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {(user?.name || "U")[0].toUpperCase()}
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-white/20 rounded-lg text-gray-300 hover:text-white hover:border-white/40 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
