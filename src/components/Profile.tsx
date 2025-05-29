"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  updated_at: string;
};

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
  });
  const router = useRouter();

  // Memeriksa status autentikasi pengguna
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth");
        return;
      }
      setUser(data.user);
    };

    fetchUser();

    // Mendengarkan perubahan status autentikasi
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          router.push("/auth");
          return;
        }
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Mengambil data profil dari Supabase
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Profil tidak ditemukan, buat profil baru
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: user.id,
                  username: user.email?.split("@")[0] || "",
                  full_name: "",
                  avatar_url: null,
                  updated_at: new Date().toISOString(),
                },
              ])
              .select()
              .single();

            if (createError) throw createError;
            setProfile(newProfile);
            setFormData({
              username: newProfile.username,
              full_name: newProfile.full_name,
            });
          } else {
            throw error;
          }
        } else {
          setProfile(data);
          setFormData({
            username: data.username,
            full_name: data.full_name,
          });
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Refresh profil setelah update
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);
      setEditing(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return (
      <div className="text-center p-4">
        <p>Silakan login untuk melihat profil Anda.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Profil Pengguna</h2>

      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 rounded-md">
          {error}
        </div>
      )}

      {loading && !profile ? (
        <div className="text-center p-4">
          <p>Memuat profil...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium mb-1"
                >
                  Nama Lengkap
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {profile?.username?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="font-medium">{user.email}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Username
                  </p>
                  <p className="font-medium">{profile?.username || "-"}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nama Lengkap
                  </p>
                  <p className="font-medium">{profile?.full_name || "-"}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Terakhir Diperbarui
                  </p>
                  <p className="font-medium">
                    {profile?.updated_at
                      ? new Date(profile.updated_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Edit Profil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
