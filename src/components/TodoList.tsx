"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import AITodoGenerator from "./AITodoGenerator";

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
  const [user, setUser] = useState<User | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
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

          if (payload.eventType === "INSERT") {
            setTodos((prev) => [payload.new as Todo, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === payload.new.id ? (payload.new as Todo) : todo
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTodos((prev) =>
              prev.filter((todo) => todo.id !== payload.old.id)
            );
          }
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

    const tempId = `temp-${Date.now()}`;
    const newTodo: Todo = {
      id: tempId,
      task: newTask,
      user_id: user.id,
      is_complete: false,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setTodos((prev) => [newTodo, ...prev]);
    setNewTask("");

    try {
      const { data, error } = await supabase
        .from("todos")
        .insert([
          {
            task: newTask,
            user_id: user.id,
            is_complete: false,
          },
        ])
        .select();

      if (error) throw error;

      // Replace temp todo with real one
      if (data && data[0]) {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === tempId ? (data[0] as Todo) : todo))
        );
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setTodos((prev) => prev.filter((todo) => todo.id !== tempId));
      setNewTask(newTask); // Restore the input
      setError(error.message);
    }
  };

  // Menandai tugas sebagai selesai atau belum selesai
  const toggleTodoStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, is_complete: !currentStatus } : todo
      )
    );

    try {
      const { error } = await supabase
        .from("todos")
        .update({ is_complete: !currentStatus })
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      // Revert optimistic update on error
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, is_complete: currentStatus } : todo
        )
      );
      setError(error.message);
    }
  };

  // Menghapus tugas
  const deleteTodo = async (id: string) => {
    // Store the todo for potential rollback
    const todoToDelete = todos.find((todo) => todo.id === id);

    // Optimistic update
    setTodos((prev) => prev.filter((todo) => todo.id !== id));

    try {
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      // Revert optimistic update on error
      if (todoToDelete) {
        setTodos((prev) => {
          const newTodos = [...prev];
          // Insert back in original position based on created_at
          const insertIndex = newTodos.findIndex(
            (todo) =>
              new Date(todo.created_at) < new Date(todoToDelete.created_at)
          );
          if (insertIndex === -1) {
            newTodos.push(todoToDelete);
          } else {
            newTodos.splice(insertIndex, 0, todoToDelete);
          }
          return newTodos;
        });
      }
      setError(error.message);
    }
  };

  // Fungsi untuk generate todos dengan AI menggunakan Gemini API
  const handleAIGenerate = async (
    description: string,
    minTasks: number,
    maxTasks: number
  ) => {
    try {
      // Call API untuk generate todos dengan Gemini
      const response = await fetch('/api/generate-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          minTasks,
          maxTasks
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghasilkan tugas');
      }

      if (!data.success || !data.tasks || data.tasks.length === 0) {
        throw new Error('Tidak ada tugas yang dihasilkan');
      }

      // Add generated todos to database dengan optimistic update
      const newTodos = data.tasks.map((task: string) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        task: task,
        is_complete: false,
        user_id: user?.id,
        created_at: new Date().toISOString()
      }));

      // Optimistic update - tambahkan ke state dulu
      setTodos(prev => [...prev, ...newTodos]);

      // Insert ke database
      const { data: insertedTodos, error } = await supabase
        .from("todos")
        .insert(
          data.tasks.map((task: string) => ({
            task: task,
            is_complete: false,
            user_id: user?.id,
          }))
        )
        .select();

      if (error) throw error;

      // Update state dengan data yang benar dari database
      if (insertedTodos) {
        setTodos(prev => {
          // Remove temporary todos
          const withoutTemp = prev.filter(todo => !todo.id.startsWith('temp-'));
          // Add real todos from database
          return [...withoutTemp, ...insertedTodos];
        });
      }

      console.log(`Successfully generated ${data.tasks.length} todos with AI`);
    } catch (error: any) {
      // Rollback optimistic update on error
      setTodos(prev => prev.filter(todo => !todo.id.startsWith('temp-')));
      setError(error.message);
      throw error;
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
        <div className="flex gap-2">
          <div className="flex flex-1">
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
          <button
            type="button"
            onClick={() => setIsAIModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all flex items-center justify-center group"
            title="Generate tugas dengan AI"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
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

      {/* AI Todo Generator Modal */}
      <AITodoGenerator
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGenerate}
      />
    </div>
  );
}
