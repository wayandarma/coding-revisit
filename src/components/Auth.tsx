"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/todos");
      }
    };
    checkUser();
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create profile for the new user
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            username: email.split("@")[0],
            full_name: "",
            avatar_url: null,
            updated_at: new Date().toISOString(),
          },
        ]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }

      setMessage({
        type: "success",
        text: "Pendaftaran berhasil! Silakan periksa email Anda untuk konfirmasi.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Terjadi kesalahan saat mendaftar.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setMessage({ type: "success", text: "Login berhasil!" });
        // Redirect to todos page after successful login
        setTimeout(() => {
          router.push("/todos");
        }, 1000);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Terjadi kesalahan saat login.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Autentikasi dengan Supabase</h1>

      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {message && (
          <div
            className={`p-3 mb-4 rounded-md ${
              message.type === "error"
                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Daftar"}
          </button>
        </div>
      </div>
    </div>
  );
}
