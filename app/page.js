"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Loading from "@/components/Loading";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/gallery");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <Loading text="Loading..." />
      </div>
    );
  }

  if (session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex items-center justify-center p-8">
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl shadow-2xl mb-8">
          <span className="text-4xl">🖼️</span>
        </div>
        <h1 className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
          Mehndi Album
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Beautiful photo album for your mehndi designs.
          <span className="block mt-2 text-lg text-pink-600 font-medium">
            Share your creativity with the world ✨
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/auth/signin"
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-10 py-4 rounded-2xl text-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3"
          >
            <span>Get Started</span>
            <span className="text-2xl">🚀</span>
          </Link>
          <Link
            href="/gallery"
            className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl text-xl font-semibold hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-200"
          >
            View Gallery
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="font-semibold text-gray-800 mb-2">Easy Upload</h3>
            <p className="text-gray-600 text-sm">
              Drag & drop multiple photos with beautiful previews
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-semibold text-gray-800 mb-2">Organize</h3>
            <p className="text-gray-600 text-sm">
              Create albums and tag your favorite designs
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="text-3xl mb-3">🌟</div>
            <h3 className="font-semibold text-gray-800 mb-2">Share</h3>
            <p className="text-gray-600 text-sm">
              Showcase your mehndi art with friends and family
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
