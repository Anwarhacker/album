"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (status === "loading") return null;
  if (!session) return null;

  const navItems = [
    { href: "/gallery", label: "Gallery", icon: "🖼️" },
    { href: "/upload", label: "Upload", icon: "⬆️" },
    { href: "/albums", label: "Albums", icon: "📁" },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/gallery"
              className="flex items-center space-x-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent hover:from-pink-700 hover:to-purple-700 transition-all duration-300"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span>Modern Gallery</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  pathname === item.href
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-pink-50 hover:text-pink-700 hover:shadow-md"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
              <div className="hidden lg:flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {(session.user.name || session.user.email)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {session.user.name || session.user.email.split("@")[0]}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-700 hover:text-pink-600 hover:bg-pink-50 focus:outline-none focus:text-pink-600 transition-colors duration-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden rounded-lg border m-2  border-pink-300 bg-gradient-to-b from-white to-pink-50/30">
            <div className="px-4 pt-3 pb-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                      : "text-gray-700 hover:bg-pink-50 hover:text-pink-700"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="px-4 py-3 border-t border-pink-100 mt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {(session.user.name || session.user.email)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {session.user.name || session.user.email.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-base font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
