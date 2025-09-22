"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Masonry from "react-masonry-css";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import Loading, { LoadingGrid } from "@/components/Loading";

export default function AlbumDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const albumId = params.id;

  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(false);
  const [editAlbumName, setEditAlbumName] = useState("");
  const [editAlbumDescription, setEditAlbumDescription] = useState("");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'compact', 'list'

  if (status === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  useEffect(() => {
    fetchAlbum();
  }, [albumId]);

  const fetchAlbum = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      if (res.ok) {
        const data = await res.json();
        setAlbum(data.album);
        setPhotos(data.album.photos || []);
        setEditAlbumName(data.album.name || "");
        setEditAlbumDescription(data.album.description || "");
      } else {
        router.push("/albums");
      }
    } catch (error) {
      console.error(error);
      router.push("/albums");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (photo) => {
    if (multiSelectMode) {
      togglePhotoSelection(photo);
      return;
    }
    setSelectedPhoto(photo);
    setModalOpen(true);
  };

  const togglePhotoSelection = (photo) => {
    setSelectedPhotos((prev) => {
      const isSelected = prev.some((p) => p._id === photo._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== photo._id);
      } else {
        return [...prev, photo];
      }
    });
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedPhotos([]);
  };

  const handleBulkRemoveFromAlbum = async () => {
    if (selectedPhotos.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to remove ${selectedPhotos.length} photo(s) from this album?`
      )
    ) {
      return;
    }

    try {
      const removePromises = selectedPhotos.map((photo) =>
        fetch(`/api/albums/${albumId}/photos`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: photo._id }),
        })
      );

      const results = await Promise.all(removePromises);
      const successCount = results.filter((res) => res.ok).length;

      if (successCount === selectedPhotos.length) {
        alert(`${successCount} photo(s) removed from album successfully!`);
      } else {
        alert(
          `${successCount} photo(s) removed, ${
            selectedPhotos.length - successCount
          } failed.`
        );
      }

      setSelectedPhotos([]);
      fetchAlbum(); // Refresh album data
    } catch (error) {
      console.error("Error removing photos from album:", error);
      alert("Failed to remove some photos from album");
    }
  };

  const closeModal = () => {
    setSelectedPhoto(null);
    setModalOpen(false);
  };

  const handleDownload = () => {
    if (selectedPhoto) {
      const link = document.createElement("a");
      link.href = selectedPhoto.url;
      link.download = `mehndi-${selectedPhoto._id}.jpg`;
      link.click();
    }
  };

  const removeFromAlbum = async () => {
    if (!selectedPhoto) return;

    try {
      const res = await fetch(`/api/albums/${albumId}/photos`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId: selectedPhoto._id }),
      });

      if (res.ok) {
        alert("Photo removed from album!");
        closeModal();
        fetchAlbum(); // Refresh album data
      } else {
        alert("Failed to remove photo from album");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to remove photo from album");
    }
  };

  const handleEditAlbum = async () => {
    if (!album) return;

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editAlbumName,
          description: editAlbumDescription,
        }),
      });

      if (res.ok) {
        alert("Album updated successfully!");
        setEditingAlbum(false);
        fetchAlbum(); // Refresh album data
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update album");
      }
    } catch (error) {
      console.error("Error updating album:", error);
      alert("Failed to update album");
    }
  };

  const handleDeleteAlbum = async () => {
    if (!album) return;

    if (
      !confirm(
        `Are you sure you want to delete the album "${album.name}"? This action cannot be undone and will not delete the photos.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Album deleted successfully!");
        router.push("/albums"); // Redirect to albums list
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete album");
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Failed to delete album");
    }
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Loading text="Loading album..." />
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-500">Album not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div className="flex-1">
            <Link
              href="/albums"
              className="text-pink-600 hover:text-pink-700 mb-2 inline-block"
            >
              ← Back to Albums
            </Link>
            {editingAlbum ? (
              <div className="space-y-4 text-black">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Album Name
                  </label>
                  <input
                    type="text"
                    value={editAlbumName}
                    onChange={(e) => setEditAlbumName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editAlbumDescription}
                    onChange={(e) => setEditAlbumDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditAlbum}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingAlbum(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
                  {album.name}
                </h1>
                {album.description && (
                  <p className="text-gray-600 mt-2">{album.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {photos.length} photos
                </p>
              </>
            )}
          </div>
          {!editingAlbum && (
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={toggleMultiSelectMode}
                className={`px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105 ${
                  multiSelectMode
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                {multiSelectMode ? "Cancel Select" : "Select Multiple"}
              </button>
              <button
                onClick={() => setEditingAlbum(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
              >
                Edit Album
              </button>
              <button
                onClick={handleDeleteAlbum}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
              >
                Delete Album
              </button>
            </div>
          )}

          {/* View Mode Controls */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
              title="Grid View"
            >
              <span className="text-sm">⊞</span>
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                viewMode === "compact"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
              title="Compact View"
            >
              <span className="text-sm">⊟</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
              title="List View"
            >
              <span className="text-sm">☰</span>
            </button>
          </div>
        </div>

        {/* Multi-Select Preview */}
        {multiSelectMode && selectedPhotos.length > 0 && (
          <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Selected Photos ({selectedPhotos.length})
              </h3>
              <button
                onClick={handleBulkRemoveFromAlbum}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
              >
                Remove from Album
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {selectedPhotos.map((photo) => (
                <div key={photo._id} className="relative">
                  <Image
                    src={photo.url}
                    alt={photo.caption || "Selected photo"}
                    width={80}
                    height={80}
                    className="w-full h-20 object-cover rounded-lg border-2 border-pink-500"
                  />
                  <button
                    onClick={() => togglePhotoSelection(photo)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="text-center text-gray-500">
            No photos in this album yet.{" "}
            <Link href="/gallery" className="text-pink-500">
              Add photos from your gallery!
            </Link>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {photos.map((photo) => (
              <div
                key={photo._id}
                className={`flex bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border-2 cursor-pointer ${
                  selectedPhotos.some((p) => p._id === photo._id)
                    ? "border-pink-500 ring-2 ring-pink-200"
                    : "border-gray-100"
                }`}
                onClick={() => openModal(photo)}
              >
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image
                    src={photo.url}
                    alt={photo.caption || "Mehndi photo"}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                  {multiSelectMode && (
                    <div className="absolute top-2 left-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPhotos.some((p) => p._id === photo._id)
                            ? "bg-pink-500 border-pink-500 text-white"
                            : "bg-white/90 border-gray-300 text-gray-500"
                        }`}
                      >
                        {selectedPhotos.some((p) => p._id === photo._id) && (
                          <span className="text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {photo.caption && (
                        <p className="text-gray-800 font-medium text-sm mb-1 line-clamp-2">
                          {photo.caption}
                        </p>
                      )}
                      {photo.tags && photo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {photo.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 text-xs px-2 py-1 rounded-full font-medium border border-pink-200/50"
                            >
                              #{tag}
                            </span>
                          ))}
                          {photo.tags.length > 3 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{photo.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        {format(new Date(photo.photo_date), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Masonry
            breakpointCols={
              viewMode === "compact"
                ? {
                    default: 6,
                    1400: 6,
                    1100: 5,
                    768: 4,
                    480: 3,
                  }
                : breakpointColumnsObj
            }
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {photos.map((photo) => (
              <div
                key={photo._id}
                className={`${
                  viewMode === "compact" ? "mb-2" : "mb-4"
                } break-inside-avoid`}
              >
                <div
                  className={`bg-white ${
                    viewMode === "compact" ? "rounded-lg" : "rounded-lg"
                  } shadow-md overflow-hidden hover:shadow-lg transition duration-200 border-2 ${
                    selectedPhotos.some((p) => p._id === photo._id)
                      ? "border-pink-500 ring-2 ring-pink-200"
                      : "border-gray-100"
                  }`}
                >
                  <div
                    className="relative cursor-pointer"
                    onClick={() => openModal(photo)}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption || "Mehndi photo"}
                      width={viewMode === "compact" ? 250 : 300}
                      height={viewMode === "compact" ? 350 : 400}
                      className="w-full h-auto object-cover"
                      style={{ aspectRatio: "auto" }}
                    />
                    {multiSelectMode && (
                      <div className="absolute top-2 left-2">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedPhotos.some((p) => p._id === photo._id)
                              ? "bg-pink-500 border-pink-500 text-white"
                              : "bg-white/90 border-gray-300 text-gray-500"
                          }`}
                        >
                          {selectedPhotos.some((p) => p._id === photo._id) && (
                            <span className="text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                      {format(new Date(photo.photo_date), "dd MMM, yyyy")}
                    </div>
                  </div>
                  {photo.caption && (
                    <div
                      className={`${viewMode === "compact" ? "p-2" : "p-4"}`}
                    >
                      <p
                        className={`text-gray-700 ${
                          viewMode === "compact" ? "text-xs" : "text-sm"
                        }`}
                      >
                        {photo.caption}
                      </p>
                      {photo.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {photo.tags.map((tag, index) => (
                            <span
                              key={index}
                              className={`bg-pink-100 text-pink-800 ${
                                viewMode === "compact"
                                  ? "text-xs px-1.5 py-0.5"
                                  : "text-xs px-2 py-1"
                              } rounded`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Masonry>
        )}

        {/* Photo Detail Modal */}
        {modalOpen && selectedPhoto && (
          <div className="fixed inset-0 bg-black text-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto mx-2">
              <div className="p-3 sm:p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Photo Details
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption || "Mehndi photo"}
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-sm sm:text-base">
                    <strong>Date:</strong>{" "}
                    {format(new Date(selectedPhoto.photo_date), "dd MMM, yyyy")}
                  </div>
                  {selectedPhoto.caption && (
                    <div className="text-sm sm:text-base">
                      <strong>Caption:</strong> {selectedPhoto.caption}
                    </div>
                  )}
                  {selectedPhoto.tags.length > 0 && (
                    <div className="text-sm sm:text-base">
                      <strong>Tags:</strong>{" "}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPhoto.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2">
                    <button
                      onClick={handleDownload}
                      className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 text-sm sm:text-base"
                    >
                      Download
                    </button>
                    <button
                      onClick={removeFromAlbum}
                      className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200 text-sm sm:text-base"
                    >
                      Remove from Album
                    </button>
                    <button
                      onClick={() => {
                        navigator
                          .share({
                            title: "Mehndi Photo",
                            text:
                              selectedPhoto.caption ||
                              "Check out this mehndi design!",
                            url: selectedPhoto.url,
                          })
                          .catch(() => {
                            // Fallback: copy to clipboard
                            navigator.clipboard.writeText(selectedPhoto.url);
                            alert("Link copied to clipboard!");
                          });
                      }}
                      className="w-full sm:w-auto bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 text-sm sm:text-base"
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
