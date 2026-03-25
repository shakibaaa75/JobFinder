// src/components/SkeletonCard.tsx
import React from "react";

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-[#16161f] border border-white/10 rounded-xl p-6 animate-pulse">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <div className="h-6 w-16 bg-gray-700 rounded-full" />
            <div className="h-6 w-20 bg-gray-700 rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-gray-700 rounded mb-2" />
          <div className="flex gap-3">
            <div className="h-4 w-20 bg-gray-700 rounded" />
            <div className="h-4 w-24 bg-gray-700 rounded" />
          </div>
        </div>
        <div className="w-10 h-10 bg-gray-700 rounded-lg" />
      </div>
      <div className="h-3 w-full bg-gray-700 rounded mb-2" />
      <div className="h-3 w-2/3 bg-gray-700 rounded mb-4" />
      <div className="flex justify-between items-center pt-3 border-t border-white/10">
        <div className="h-3 w-20 bg-gray-700 rounded" />
        <div className="h-4 w-24 bg-gray-700 rounded" />
      </div>
    </div>
  );
};

export default SkeletonCard;
