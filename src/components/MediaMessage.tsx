// src/components/MediaMessage.tsx
import React, { useState } from "react";
import api from "../services/api";

interface MediaMessageProps {
  id: number;
  mediaType: "image" | "video";
  filePath: string;
  fileName: string;
  fileSize: number;
  isOwn: boolean;
  createdAt: string;
  onDelete?: () => void;
}

export const MediaMessage: React.FC<MediaMessageProps> = ({
  id,
  mediaType,
  filePath,
  fileName,
  fileSize,
  isOwn,
  createdAt,
  onDelete,
}) => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Ensure filePath is a full URL
  const getImageUrl = () => {
    // If it's already a full URL, return it
    if (filePath.startsWith("http")) return filePath;
    // If it's a relative path starting with /api, use it as is (vite proxy will handle)
    if (filePath.startsWith("/api")) return filePath;
    // Otherwise, construct the full path
    return `/api/media/${id}`;
  };

  const imageUrl = getImageUrl();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this media?")) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/media/${id}`, true);
      onDelete?.();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete media");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={`${isOwn ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block max-w-sm rounded-lg overflow-hidden shadow-lg ${isOwn ? "bg-indigo-600" : "bg-[#2a2a3a]"}`}
        >
          {mediaType === "image" && !loadError && (
            <div className="relative">
              {!imageLoaded && (
                <div className="w-full h-48 bg-gray-700 animate-pulse flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-500 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
              <img
                src={imageUrl}
                alt={fileName}
                className={`max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition ${!imageLoaded ? "hidden" : ""}`}
                onClick={() => setShowFullscreen(true)}
                onLoad={() => {
                  console.log("Image loaded:", imageUrl);
                  setImageLoaded(true);
                }}
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl);
                  setLoadError(true);
                  setImageLoaded(true);
                  e.currentTarget.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20"%3E%3C/rect%3E%3Cline x1="2" y1="22" x2="22" y2="2"%3E%3C/line%3E%3C/svg%3E';
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {formatFileSize(fileSize)}
              </div>
            </div>
          )}

          {mediaType === "video" && !loadError && (
            <div className="relative">
              <video
                src={imageUrl}
                controls
                className="max-w-full max-h-64"
                preload="metadata"
                onError={() => {
                  console.error("Video failed to load:", imageUrl);
                  setLoadError(true);
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {formatFileSize(fileSize)}
              </div>
            </div>
          )}

          {loadError && (
            <div className="p-4 text-center">
              <div className="text-red-400 text-sm">Failed to load media</div>
              <div className="text-xs text-gray-400 mt-1">{fileName}</div>
              <div className="text-xs text-gray-500 mt-1">{imageUrl}</div>
            </div>
          )}

          <div className="text-xs text-gray-300 px-3 py-2 flex justify-between items-center border-t border-gray-600">
            <span className="truncate max-w-[150px]" title={fileName}>
              {fileName}
            </span>
            <span>{formatTime(createdAt)}</span>
          </div>

          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full text-xs text-red-400 hover:text-red-300 py-1 border-t border-gray-600 hover:bg-red-900/20 transition disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen modal for images */}
      {showFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
            onClick={() => setShowFullscreen(false)}
          >
            ✕
          </button>
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
};
