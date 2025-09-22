"use client";

import { useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userCount, setUserCount] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [managingPhotos, setManagingPhotos] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [deletingPhotos, setDeletingPhotos] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserCount(data.userCount);
        setUsers(data.users);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    await fetchData();
  };

  const handleDelete = async (userId) => {
    if (
      !confirm("Are you sure you want to delete this user and all their data?")
    ) {
      return;
    }
    setDeletingId(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh data
        await fetchData();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhotos(data.photos);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleManagePhotos = () => {
    setManagingPhotos(true);
    fetchPhotos();
  };

  const handleSelectPhoto = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map((photo) => photo._id));
    }
  };

  const handleDeleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedPhotos.length} selected photos?`
      )
    ) {
      return;
    }
    setDeletingPhotos(true);
    setError("");
    try {
      const res = await fetch("/api/admin/delete-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, photoIds: selectedPhotos }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedPhotos([]);
        await fetchPhotos();
        await fetchData(); // Refresh user counts
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setDeletingPhotos(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl shadow-xl mb-4">
              <span className="text-xl sm:text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>

          {userCount !== null ? (
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                  <div className="text-3xl sm:text-4xl mb-2">👥</div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">
                    Total Registered Users
                  </h2>
                  <p className="text-2xl sm:text-3xl font-bold">{userCount}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                  User List
                </h3>
                {users.map((user, index) => (
                  <div
                    key={user._id}
                    className="bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">
                          {user.name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.photoCount} photos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => handleDelete(user._id)}
                        disabled={deletingId === user._id}
                        className="px-3 py-2 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 disabled:opacity-50 text-sm sm:text-base"
                      >
                        {deletingId === user._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={handleManagePhotos}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Manage Photos
                </button>
              </div>

              {managingPhotos && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">
                      Photo Management
                    </h3>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            selectedPhotos.length === photos.length &&
                            photos.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Select All</span>
                      </label>
                      <button
                        onClick={handleDeleteSelectedPhotos}
                        disabled={selectedPhotos.length === 0 || deletingPhotos}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 disabled:opacity-50"
                      >
                        {deletingPhotos
                          ? "Deleting..."
                          : `Delete Selected (${selectedPhotos.length})`}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {photos.map((photo) => (
                      <div
                        key={photo._id}
                        className="relative bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || "Photo"}
                          className="w-full h-32 sm:h-40 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedPhotos.includes(photo._id)}
                            onChange={() => handleSelectPhoto(photo._id)}
                            className="rounded"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 truncate">
                            {photo.user_id?.name || "Unknown"} -{" "}
                            {photo.user_id?.email || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(photo.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border text-black border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 text-black transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Access Admin Panel
              </button>
              {error && (
                <p className="text-red-500 text-center text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
