"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/Loading";

export default function Upload() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [photoDate, setPhotoDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [generatingPreviews, setGeneratingPreviews] = useState(false);

  if (status === "loading") return <div>Loading...</div>;
  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (selectedFiles) => {
    const validFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    const invalidFiles = selectedFiles.filter(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFiles.length > 0) {
      alert(
        `${invalidFiles.length} file(s) were skipped. Only image files are allowed.`
      );
    }

    if (validFiles.length > 0) {
      // Check total file limit (20 files max)
      const totalFiles = files.length + validFiles.length;
      if (totalFiles > 20) {
        alert(
          `You can upload a maximum of 20 images at once. ${
            totalFiles - 20
          } file(s) were skipped.`
        );
        validFiles.splice(20 - files.length); // Keep only up to the limit
      }

      // Add new files to existing files
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);

      // Generate previews for new files
      setGeneratingPreviews(true);
      let processedCount = 0;

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prevPreviews) => [
            ...prevPreviews,
            {
              file,
              preview: e.target.result,
              id: Date.now() + Math.random(),
            },
          ]);
          processedCount++;
          if (processedCount === validFiles.length) {
            setGeneratingPreviews(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (fileToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    setPreviews((prevPreviews) =>
      prevPreviews.filter((preview) => preview.file !== fileToRemove)
    );
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles && droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Upload each file
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("photoDate", photoDate);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        alert(
          `${successCount} photo(s) uploaded successfully!${
            failCount > 0 ? ` ${failCount} failed.` : ""
          }`
        );
        // Clear form on success
        setFiles([]);
        setPreviews([]);
        setPhotoDate("");
        router.push("/gallery");
      } else {
        alert("All uploads failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 p-2 sm:p-4 md:p-8 text-black">
      <div className="max-w-sm sm:max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl">⬆️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Upload Mehndi Photo
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base">
            Share your beautiful mehndi designs with the world
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center transition-colors ${
                isDragOver
                  ? "border-pink-500 bg-pink-50"
                  : files.length > 0
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-pink-400"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {generatingPreviews ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    <p>Generating previews...</p>
                  </div>
                </div>
              ) : previews.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previews.slice(0, 8).map((preview, index) => (
                      <div key={preview.id} className="relative">
                        <img
                          src={preview.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 sm:h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(preview.file)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {previews.length > 8 && (
                      <div className="w-full h-20 sm:h-24 bg-gray-200 rounded-md flex items-center justify-center text-sm text-gray-600">
                        +{previews.length - 8} more
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-green-600">
                      ✓ {files.length} photo{files.length !== 1 ? "s" : ""}{" "}
                      selected
                    </p>
                    <p>Drag more images here or click to add more</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl sm:text-6xl text-gray-400">
                    {isDragOver ? "📂" : "🖼️"}
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-medium text-gray-700">
                      {isDragOver
                        ? "Drop your images here"
                        : "Drag & drop your mehndi photos"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Select multiple files at once • Up to 20 images
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required={files.length === 0}
              />
            </div>

            {files.length > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                <div className="flex justify-between items-center">
                  <span>
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                    (
                    {files.reduce((total, file) => total + file.size, 0) /
                      1024 /
                      1024 <
                    1
                      ? `${(
                          files.reduce((total, file) => total + file.size, 0) /
                          1024
                        ).toFixed(1)} KB`
                      : `${(
                          files.reduce((total, file) => total + file.size, 0) /
                          1024 /
                          1024
                        ).toFixed(1)} MB`}{" "}
                    total)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      setPreviews([]);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="mr-2">📅</span>
                Photo Date
              </label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                required
                className="w-full p-3 sm:p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50/50 transition-all duration-300 text-sm sm:text-base"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={uploading || files.length === 0 || !photoDate}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 font-semibold text-base sm:text-lg"
          >
            {uploading && <LoadingSpinner size="sm" />}
            <span>
              {uploading
                ? `Uploading ${files.length} photo${
                    files.length !== 1 ? "s" : ""
                  }...`
                : `Upload ${files.length} Photo${
                    files.length !== 1 ? "s" : ""
                  }`}
            </span>
            {!uploading && <span className="text-xl">🚀</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
