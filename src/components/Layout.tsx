// src/components/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
