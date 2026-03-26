// src/components/MediaUpload.tsx
import React, { useRef, useState } from "react";
import api from "../services/api";

interface MediaUploadProps {
  receiverId: number;
  onUploadComplete: () => void;
  onError?: (error: string) => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  receiverId,
  onUploadComplete,
  onError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      onError?.("Please select an image or video file");
      return;
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      onError?.("File size must be less than 50MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("media", file);
    formData.append("receiver_id", receiverId.toString());

    try {
      // Use XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percent));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 201 || xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onUploadComplete();
          onError?.("Media uploaded successfully!");
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            onError?.(error.error || "Upload failed");
          } catch {
            onError?.("Upload failed");
          }
        }
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener("error", () => {
        onError?.("Network error during upload");
        setUploading(false);
        setUploadProgress(0);
      });

      const token = localStorage.getItem("gjb_token");
      xhr.open("POST", "http://localhost:5500/api/media/send");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (error: any) {
      console.error("Upload failed:", error);
      onError?.(error.response?.data?.error || "Failed to upload media");
      setUploading(false);
      setUploadProgress(0);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="media-upload"
      />
      <label
        htmlFor="media-upload"
        className={`cursor-pointer p-2 hover:bg-gray-700 rounded-lg transition inline-flex items-center gap-2 ${
          uploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Upload photo or video"
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>
              {uploadProgress > 0 ? `${uploadProgress}%` : "Uploading..."}
            </span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">Photo/Video</span>
          </>
        )}
      </label>

      {/* Tooltip on hover */}
      {!uploading && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap">
          Send photo or video
        </div>
      )}
    </div>
  );
};
