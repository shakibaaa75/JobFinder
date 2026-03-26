// src/components/MediaUpload.tsx
import React, { useRef, useState } from "react";

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

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      onError?.("Please select an image or video file");
      return;
    }

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
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percent));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 201 || xhr.status === 200) {
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
        className={`cursor-pointer p-2 rounded-full transition flex items-center justify-center ${
          uploading
            ? "opacity-50 cursor-not-allowed text-[#007aff]"
            : "text-[#007aff] hover:bg-[#007aff]/10"
        }`}
        title="Upload photo or video"
      >
        {uploading ? (
          <div className="relative">
            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
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
            {uploadProgress > 0 && (
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-[#007aff]">
                {uploadProgress}%
              </span>
            )}
          </div>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        )}
      </label>
    </div>
  );
};
