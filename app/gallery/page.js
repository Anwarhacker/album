"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Masonry from "react-masonry-css";
import Image from "next/image";
import Link from "next/link";
import { format, isToday, isWithinInterval, subDays } from "date-fns";
import Loading, { LoadingGrid } from "@/components/Loading";

export default function Gallery() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("gallery"); // 'gallery' or 'timeline'
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editTags, setEditTags] = useState("");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'compact', 'list'

  // Handle authentication loading and redirect
  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchPhotos();
      fetchAlbums();
    }
  }, [search, session]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/photos?search=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/albums");
      const data = await res.json();
      setAlbums(data.albums || []);
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  const addToAlbum = async () => {
    if (!selectedAlbum || !selectedPhoto) return;

    try {
      const res = await fetch(`/api/albums/${selectedAlbum}/photos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId: selectedPhoto._id }),
      });

      if (res.ok) {
        alert("Photo added to album!");
        setSelectedAlbum("");
        fetchAlbums(); // Refresh albums to update photo counts
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add photo to album");
      }
    } catch (error) {
      console.error("Error adding to album:", error);
      alert("Failed to add photo to album");
    }
  };

  const groupPhotosByDate = (photos) => {
    const groups = {};
    photos.forEach((photo) => {
      const date = format(new Date(photo.photo_date), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(photo);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  };

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (
      isWithinInterval(date, { start: subDays(new Date(), 7), end: new Date() })
    )
      return "Last 7 days";
    return format(date, "MMMM yyyy");
  };

  const openModal = (photo) => {
    if (multiSelectMode) {
      togglePhotoSelection(photo);
      return;
    }
    setSelectedPhoto(photo);
    setEditCaption(photo.caption || "");
    setEditTags(photo.tags ? photo.tags.join(", ") : "");
    setEditingPhoto(false);
    setModalOpen(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = "hidden";
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

  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedPhotos.length} photo(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const deletePromises = selectedPhotos.map((photo) =>
        fetch(`/api/photos/${photo._id}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((res) => res.ok).length;

      if (successCount === selectedPhotos.length) {
        alert(`${successCount} photo(s) deleted successfully!`);
      } else {
        alert(
          `${successCount} photo(s) deleted, ${
            selectedPhotos.length - successCount
          } failed.`
        );
      }

      setSelectedPhotos([]);
      fetchPhotos(); // Refresh the gallery
    } catch (error) {
      console.error("Error deleting photos:", error);
      alert("Failed to delete some photos");
    }
  };

  const handleBulkAddToAlbum = async () => {
    if (!selectedAlbum || selectedPhotos.length === 0) return;

    try {
      const addPromises = selectedPhotos.map((photo) =>
        fetch(`/api/albums/${selectedAlbum}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: photo._id }),
        })
      );

      const results = await Promise.all(addPromises);
      const successCount = results.filter((res) => res.ok).length;

      if (successCount === selectedPhotos.length) {
        alert(`${successCount} photo(s) added to album successfully!`);
      } else {
        alert(
          `${successCount} photo(s) added, ${
            selectedPhotos.length - successCount
          } failed.`
        );
      }

      setSelectedPhotos([]);
      fetchAlbums(); // Refresh albums to update counts
    } catch (error) {
      console.error("Error adding photos to album:", error);
      alert("Failed to add some photos to album");
    }
  };

  const closeModal = () => {
    setSelectedPhoto(null);
    setModalOpen(false);
    // Restore body scrolling
    document.body.style.overflow = "unset";
  };

  const handleDownload = () => {
    if (selectedPhoto) {
      const link = document.createElement("a");
      link.href = selectedPhoto.url;
      link.download = `mehndi-${selectedPhoto._id}.jpg`;
      link.click();
    }
  };

  const handleShare = async () => {
    if (!selectedPhoto) return;

    const shareData = {
      title: "Mehndi Photo",
      text: selectedPhoto.caption || "Check out this mehndi design!",
      url: selectedPhoto.url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(selectedPhoto.url);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Final fallback
      try {
        await navigator.clipboard.writeText(selectedPhoto.url);
        alert("Link copied to clipboard!");
      } catch (clipboardError) {
        alert("Unable to share or copy link");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedPhoto) return;

    if (
      !confirm(
        "Are you sure you want to delete this photo? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/photos/${selectedPhoto._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Photo deleted successfully!");
        closeModal();
        fetchPhotos(); // Refresh the photos list
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete photo");
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo");
    }
  };

  const handleEdit = async () => {
    if (!selectedPhoto) return;

    const tags = editTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      const res = await fetch(`/api/photos/${selectedPhoto._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: editCaption,
          tags: tags,
        }),
      });

      if (res.ok) {
        alert("Photo updated successfully!");
        setEditingPhoto(false);
        fetchPhotos(); // Refresh the photos list
        // Update the selected photo in the modal
        const data = await res.json();
        setSelectedPhoto(data.photo);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update photo");
      }
    } catch (error) {
      console.error("Error updating photo:", error);
      alert("Failed to update photo");
    }
  };

  const handleRegenerateCaption = async () => {
    if (!selectedPhoto) return;

    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: selectedPhoto.url,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEditCaption(data.caption);
        alert("New caption generated! Click 'Save Changes' to apply it.");
      } else {
        alert("Failed to generate new caption");
      }
    } catch (error) {
      console.error("Error regenerating caption:", error);
      alert("Failed to generate new caption");
    }
  };

  const handleRegenerateTags = async () => {
    if (!selectedPhoto) return;

    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: selectedPhoto.url,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEditTags(data.tags ? data.tags.join(", ") : "");
        alert("New tags generated! Click 'Save Changes' to apply them.");
      } else {
        alert("Failed to generate new tags");
      }
    } catch (error) {
      console.error("Error regenerating tags:", error);
      alert("Failed to generate new tags");
    }
  };

  // Improved responsive breakpoints
  const breakpointColumnsObj = {
    default: 4,
    1400: 4,
    1100: 3,
    768: 2,
    480: 1,
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null; // Will redirect via useEffect
  }

  const groupedPhotos = groupPhotosByDate(photos);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col space-y-4 mb-6 sm:mb-8 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
            {/* User Info - Hidden on small screens, visible on large */}
            <div className=" lg:flex items-center space-x-3 text-center">
              {/* <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm text-center capitalize font-bold">
                  {(session.user.name || session.user.email)
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div> */}
              <div className="flex flex-col">
                <span className="text-lg text-gray-800 font-semibold capitalize ">
                  Welcome ,{" "}
                  {session.user.name || session.user.email.split("@")[0]}
                </span>
                <span className="text-xs text-gray-500">
                  {photos.length} photos
                </span>
              </div>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex gap-2 justify-center lg:justify-end">
              <button
                onClick={() => setView("gallery")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  view === "gallery"
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md"
                }`}
              >
                <span className="text-lg">🖼️</span>
                <span className="hidden sm:inline">Gallery</span>
              </button>
              <button
                onClick={() => setView("timeline")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  view === "timeline"
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md"
                }`}
              >
                <span className="text-lg">📅</span>
                <span className="hidden sm:inline">Timeline</span>
              </button>
              <button
                onClick={toggleMultiSelectMode}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  multiSelectMode
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md"
                }`}
              >
                <span className="text-lg">☑️</span>
                <span className="hidden sm:inline">Select</span>
              </button>
            </div>

            {/* View Mode Controls */}
            <div className="flex gap-1 justify-center lg:justify-end">
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

          {/* Search Section */}
          <div className="mb-6 sm:mb-8">
            <div className="relative max-w-md mx-auto lg:mx-0">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search by caption or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-lg text-gray-900 placeholder-gray-500 transition-all duration-300 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Multi-Select Preview */}
          {multiSelectMode && selectedPhotos.length > 0 && (
            <div className="mb-6 sm:mb-8 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Selected Photos ({selectedPhotos.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedAlbum}
                    onChange={(e) => setSelectedAlbum(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Choose album...</option>
                    {albums.map((album) => (
                      <option key={album._id} value={album._id}>
                        {album.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkAddToAlbum}
                    disabled={!selectedAlbum}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transform hover:scale-105 disabled:transform-none"
                  >
                    Add to Album
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
                  >
                    Delete Selected
                  </button>
                </div>
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

          {/* Content Area */}
          {loading ? (
            <LoadingGrid count={8} />
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No photos found
              </h3>
              <p className="text-gray-500 mb-6">
                {search
                  ? "Try adjusting your search terms"
                  : "Get started by uploading your first photo"}
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <span>📷</span>
                Upload Photo
              </Link>
            </div>
          ) : view === "gallery" ? (
            viewMode === "list" ? (
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
                            {selectedPhotos.some(
                              (p) => p._id === photo._id
                            ) && <span className="text-xs">✓</span>}
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
                className="flex w-auto -ml-2 sm:-ml-3"
                columnClassName="pl-2 sm:pl-3 bg-clip-padding"
              >
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo._id}
                    photo={photo}
                    onOpenModal={openModal}
                    isSelected={selectedPhotos.some((p) => p._id === photo._id)}
                    multiSelectMode={multiSelectMode}
                    compact={viewMode === "compact"}
                  />
                ))}
              </Masonry>
            )
          ) : (
            <div className="space-y-8 sm:space-y-12">
              {groupedPhotos.map(([dateStr, datePhotos]) => (
                <div key={dateStr}>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 sticky top-0 bg-gradient-to-br from-pink-50 to-purple-50 py-2 z-10">
                    {getDateLabel(dateStr)}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({datePhotos.length} photo
                      {datePhotos.length !== 1 ? "s" : ""})
                    </span>
                  </h2>
                  {viewMode === "list" ? (
                    <div className="space-y-4">
                      {datePhotos.map((photo) => (
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
                                    selectedPhotos.some(
                                      (p) => p._id === photo._id
                                    )
                                      ? "bg-pink-500 border-pink-500 text-white"
                                      : "bg-white/90 border-gray-300 text-gray-500"
                                  }`}
                                >
                                  {selectedPhotos.some(
                                    (p) => p._id === photo._id
                                  ) && <span className="text-xs">✓</span>}
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
                                    {photo.tags
                                      .slice(0, 3)
                                      .map((tag, index) => (
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
                      className="flex w-auto -ml-2 sm:-ml-3"
                      columnClassName="pl-2 sm:pl-3 bg-clip-padding"
                    >
                      {datePhotos.map((photo) => (
                        <PhotoCard
                          key={photo._id}
                          photo={photo}
                          onOpenModal={openModal}
                          showDate={false}
                          isSelected={selectedPhotos.some(
                            (p) => p._id === photo._id
                          )}
                          multiSelectMode={multiSelectMode}
                          compact={viewMode === "compact"}
                        />
                      ))}
                    </Masonry>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Modal */}
          {modalOpen && selectedPhoto && (
            <PhotoModal
              photo={selectedPhoto}
              albums={albums}
              selectedAlbum={selectedAlbum}
              setSelectedAlbum={setSelectedAlbum}
              onClose={closeModal}
              onDownload={handleDownload}
              onShare={handleShare}
              onAddToAlbum={addToAlbum}
              onDelete={handleDelete}
              editingPhoto={editingPhoto}
              setEditingPhoto={setEditingPhoto}
              editCaption={editCaption}
              setEditCaption={setEditCaption}
              editTags={editTags}
              setEditTags={setEditTags}
              onEdit={handleEdit}
              onRegenerateCaption={handleRegenerateCaption}
              onRegenerateTags={handleRegenerateTags}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Photo Card Component
function PhotoCard({
  photo,
  onOpenModal,
  showDate = true,
  isSelected = false,
  multiSelectMode = false,
  compact = false,
}) {
  return (
    <div
      className={`${
        compact ? "mb-2 sm:mb-3" : "mb-4 sm:mb-6"
      } break-inside-avoid group`}
    >
      <div
        className={`bg-white ${
          compact ? "rounded-lg" : "rounded-xl sm:rounded-2xl"
        } shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${
          isSelected
            ? "border-pink-500 ring-2 ring-pink-200"
            : "border-gray-100"
        }`}
      >
        <div
          className="relative cursor-pointer overflow-hidden"
          onClick={() => onOpenModal(photo)}
        >
          <Image
            src={photo.url}
            alt={photo.caption || "Mehndi photo"}
            width={compact ? 300 : 400}
            height={compact ? 400 : 500}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
            style={{ aspectRatio: "auto" }}
            sizes={
              compact
                ? "(max-width: 480px) 33vw, (max-width: 768px) 25vw, (max-width: 1100px) 20vw, 16vw"
                : "(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw"
            }
            priority={false}
            loading="lazy"
          />
          {multiSelectMode && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? "bg-pink-500 border-pink-500 text-white"
                    : "bg-white/90 border-gray-300 text-gray-500"
                }`}
              >
                {isSelected && <span className="text-xs">✓</span>}
              </div>
            </div>
          )}
          {showDate && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full shadow-lg backdrop-blur-sm bg-opacity-90 font-medium">
              {format(new Date(photo.photo_date), "dd MMM")}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {!multiSelectMode && (
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                <span className="text-gray-700 text-sm">👁️</span>
              </div>
            </div>
          )}
        </div>
        {(photo.caption || (photo.tags && photo.tags.length > 0)) && (
          <div className="p-3 sm:p-4 bg-gradient-to-br from-white to-pink-50/30">
            {photo.caption && (
              <p className="text-gray-800 text-sm font-medium leading-relaxed mb-2 line-clamp-3">
                {photo.caption}
              </p>
            )}
            {photo.tags && photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-2">
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
          </div>
        )}
      </div>
    </div>
  );
}

// Photo Modal Component
function PhotoModal({
  photo,
  albums,
  selectedAlbum,
  setSelectedAlbum,
  onClose,
  onDownload,
  onShare,
  onAddToAlbum,
  onDelete,
  editingPhoto,
  setEditingPhoto,
  editCaption,
  setEditCaption,
  editTags,
  setEditTags,
  onEdit,
  onRegenerateCaption,
  onRegenerateTags,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-pink-50 to-purple-50">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Photo Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl p-1 hover:bg-gray-100 rounded-full transition-colors w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <Image
              src={photo.url}
              alt={photo.caption || "Mehndi photo"}
              width={800}
              height={600}
              className="w-full h-auto rounded-lg shadow-lg"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
              <div>
                <span className="font-semibold text-gray-700">Date:</span>
                <p className="text-gray-600 mt-1">
                  {format(new Date(photo.photo_date), "EEEE, dd MMMM yyyy")}
                </p>
              </div>

              {photo.caption && (
                <div>
                  <span className="font-semibold text-gray-700">Caption:</span>
                  <p className="text-gray-600 mt-1">{photo.caption}</p>
                </div>
              )}
            </div>

            {photo.tags && photo.tags.length > 0 && (
              <div>
                <span className="font-semibold text-gray-700">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {photo.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 text-xs px-3 py-1 rounded-full font-medium border border-pink-200/50"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Form */}
            {editingPhoto ? (
              <div className="pt-4 border-t border-gray-100 space-y-4 text-black">
                <h3 className="font-semibold text-gray-700">
                  Edit Photo Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caption
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Enter caption..."
                    />
                    <button
                      onClick={onRegenerateCaption}
                      className="px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105 whitespace-nowrap"
                      title="Generate AI caption"
                    >
                      🤖 AI
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="tag1, tag2, tag3..."
                    />
                    <button
                      onClick={onRegenerateTags}
                      className="px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105 whitespace-nowrap"
                      title="Generate AI tags"
                    >
                      🏷️ AI
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onEdit}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingPhoto(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEditingPhoto(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
                >
                  <span>✏️</span>
                  Edit Details
                </button>
              </div>
            )}

            {/* Album Selection */}
            {albums.length > 0 && (
              <div className="pt-2 border-t text-black border-gray-100">
                <span className="font-semibold text-gray-700">
                  Add to Album:
                </span>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <select
                    value={selectedAlbum}
                    onChange={(e) => setSelectedAlbum(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Select an album...</option>
                    {albums.map((album) => (
                      <option key={album._id} value={album._id}>
                        {album.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={onAddToAlbum}
                    disabled={!selectedAlbum}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transform hover:scale-105 disabled:transform-none"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={onDownload}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
              >
                <span>⬇️</span>
                Download
              </button>
              <button
                onClick={onShare}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
              >
                <span>🔗</span>
                Share
              </button>
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium transform hover:scale-105"
              >
                <span>🗑️</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
