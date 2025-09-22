"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/Loading";

export default function SignIn() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLogin) {
      // Login
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
      } else {
        router.push("/gallery");
      }
    } else {
      // Register
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (res.ok) {
          // Auto login after registration
          const result = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (result?.error) {
            setError("Registration successful, but login failed");
          } else {
            router.push("/gallery");
          }
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError("Registration failed");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl">{isLogin ? "🔐" : "✨"}</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            {isLogin ? "Welcome Back" : "Join Mehndi Album"}
          </h1>
          <p className="text-gray-600 text-sm">
            {isLogin
              ? "Sign in to your account"
              : "Create your account to get started"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold mb-3 text-black flex items-center">
                <span className="mr-2">👤</span>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black bg-gray-50/50 transition-all duration-300"
                placeholder="Enter your full name"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-black mb-3 flex items-center">
              <span className="mr-2">📧</span>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black bg-gray-50/50 transition-all duration-300"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span className="mr-2">🔒</span>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black bg-gray-50/50 transition-all duration-300"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 px-6 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 font-semibold text-lg"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span>
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </span>
            {!loading && (
              <span className="text-xl">{isLogin ? "🚪" : "🎉"}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setFormData({ name: "", email: "", password: "" });
            }}
            className="text-pink-500 hover:text-pink-600"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
