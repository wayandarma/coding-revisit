"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Todo = {
  id: string;
  task: string;
  is_complete: boolean;
  created_at: string;
  user_id: string;
};

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Memeriksa status autentikasi pengguna
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    fetchUser();

    // Mendengarkan perubahan status autentikasi
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Mengambil daftar tugas dari Supabase
  useEffect(() => {
    if (!user) return;

    const fetchTodos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("todos")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTodos(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();

    // Mendengarkan perubahan pada tabel todos
    const todosSubscription = supabase
      .channel("todos_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Change received!", payload);
          fetchTodos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(todosSubscription);
    };
  }, [user]);

  // Menambahkan tugas baru
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;

    try {
      const { error } = await supabase.from("todos").insert([
        {
          task: newTask,
          user_id: user.id,
          is_complete: false,
        },
      ]);

      if (error) throw error;
      setNewTask("");
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Menandai tugas sebagai selesai atau belum selesai
  const toggleTodoStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("todos")
        .update({ is_complete: !currentStatus })
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Menghapus tugas
  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-4">
        <p>Silakan login untuk melihat dan mengelola tugas Anda.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Daftar Tugas</h2>

      <form onSubmit={addTodo} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Tambahkan tugas baru..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Tambah
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center p-4">
          <p>Memuat tugas...</p>
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
          <p>Belum ada tugas. Tambahkan tugas pertama Anda!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.is_complete}
                  onChange={() => toggleTodoStatus(todo.id, todo.is_complete)}
                  className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span
                  className={`${
                    todo.is_complete
                      ? "line-through text-gray-500 dark:text-gray-400"
                      : ""
                  }`}
                >
                  {todo.task}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
