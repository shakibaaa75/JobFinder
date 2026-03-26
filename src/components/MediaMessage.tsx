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

  const getImageUrl = () => {
    if (filePath.startsWith("http")) return filePath;
    if (filePath.startsWith("/api")) return filePath;
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
      <div
        className={`rounded-2xl overflow-hidden ${
          isOwn ? "bg-[#007aff] rounded-br-md" : "bg-[#2c2c2e] rounded-bl-md"
        }`}
      >
        {mediaType === "image" && !loadError && (
          <div className="relative">
            {!imageLoaded && (
              <div className="w-48 h-48 bg-gray-700 animate-pulse flex items-center justify-center rounded-2xl">
                <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={fileName}
              className={`max-w-[250px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition ${
                !imageLoaded ? "hidden" : "block"
              }`}
              onClick={() => setShowFullscreen(true)}
              onLoad={() => setImageLoaded(true)}
              onError={() => setLoadError(true)}
            />
          </div>
        )}

        {mediaType === "video" && !loadError && (
          <div className="relative max-w-[250px]">
            <video
              src={imageUrl}
              controls
              className="max-w-full max-h-[300px] rounded-2xl"
              preload="metadata"
              onError={() => setLoadError(true)}
            />
          </div>
        )}

        {loadError && (
          <div className="p-4 text-center bg-[#2c2c2e] rounded-2xl">
            <div className="text-red-400 text-sm">Failed to load</div>
            <div className="text-xs text-gray-400 mt-1">{fileName}</div>
          </div>
        )}

        {/* File info bar */}
        <div
          className={`px-3 py-2 flex justify-between items-center text-xs ${
            isOwn ? "text-white/70" : "text-gray-400"
          }`}
        >
          <span className="truncate max-w-[120px]" title={fileName}>
            {fileName}
          </span>
          <div className="flex items-center gap-2">
            <span>{formatFileSize(fileSize)}</span>
            <span>{formatTime(createdAt)}</span>
          </div>
        </div>

        {/* Delete button for own messages */}
        {isOwn && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full text-xs text-red-400 hover:text-red-300 py-2 border-t border-white/10 hover:bg-red-900/20 transition disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      {/* Fullscreen modal */}
      {showFullscreen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full"
            onClick={() => setShowFullscreen(false)}
          >
            ✕
          </button>
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
};
