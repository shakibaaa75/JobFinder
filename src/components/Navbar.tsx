// src/components/Navbar.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Menu, X } from "lucide-react"; // Install lucide-react or use any icon library

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = (): void => {
    logout();
    success("Logged out successfully");
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={closeMobileMenu}
          >
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-bold text-xl text-white">GoJobBoard</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          isMobileMenuOpen
            ? "visible bg-black/50 backdrop-blur-sm"
            : "invisible pointer-events-none"
        }`}
        onClick={closeMobileMenu}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-16 right-0 bottom-0 z-40 w-64 bg-[#0a0a0f] border-l border-white/10 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex flex-col p-4 space-y-2">
            {/* Mobile Navigation Links */}
            <Link
              to="/jobs"
              onClick={closeMobileMenu}
              className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
            >
              Browse Jobs
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/post-job"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Post a Job
                </Link>
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/messages"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Messages
                </Link>
                <Link
                  to="/friends"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Friends
                </Link>
              </>
            )}

            <div className="border-t border-white/10 my-2" />

            {isAuthenticated ? (
              <>
                <Link
                  to={`/user/${user?.id}`}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {(user?.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="flex-1">{user?.name || "My Account"}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium text-center transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
