"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loading from "@/components/Loading";

export default function Albums() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");

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
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/albums");
      const data = await res.json();
      setAlbums(data.albums);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createAlbum = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newAlbumName,
          description: newAlbumDescription,
        }),
      });

      if (res.ok) {
        setNewAlbumName("");
        setNewAlbumDescription("");
        setShowCreateForm(false);
        fetchAlbums();
      } else {
        alert("Failed to create album");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create album");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
            My Albums
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition duration-200 w-full sm:w-auto"
          >
            {showCreateForm ? "Cancel" : "Create Album"}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white p-6 text-black rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Album</h2>
            <form onSubmit={createAlbum}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album Name
                </label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
              <button
                type="submit"
                className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition duration-200"
              >
                Create Album
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <Loading text="Loading albums..." />
        ) : albums.length === 0 ? (
          <div className="text-center text-gray-500">
            No albums yet. Create your first album!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <div
                key={album._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {album.name}
                  </h3>
                  {album.description && (
                    <p className="text-gray-600 mb-4">{album.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mb-4">
                    {album.photos.length} photos
                  </p>
                  <Link
                    href={`/albums/${album._id}`}
                    className="w-full bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 transition duration-200 text-center block"
                  >
                    View Album
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
