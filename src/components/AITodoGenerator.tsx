"use client";

import { useState } from "react";

type AITodoGeneratorProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (description: string, minTasks: number, maxTasks: number) => void;
};

export default function AITodoGenerator({
  isOpen,
  onClose,
  onGenerate,
}: AITodoGeneratorProps) {
  const [description, setDescription] = useState("");
  const [minTasks, setMinTasks] = useState(3);
  const [maxTasks, setMaxTasks] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await onGenerate(description, minTasks, maxTasks);
      setSuccessMessage(`Berhasil menghasilkan tugas dengan AI! 🎉`);

      // Auto close modal after success
      setTimeout(() => {
        setDescription("");
        setMinTasks(3);
        setMaxTasks(8);
        setSuccessMessage("");
        onClose();
      }, 1500);
    } catch (error: any) {
      setErrorMessage(
        error.message || "Terjadi kesalahan saat menghasilkan tugas"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setDescription("");
      setMinTasks(3);
      setMaxTasks(8);
      setSuccessMessage("");
      setErrorMessage("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Todo Generator
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Description Input */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Deskripsi Tugas
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Saya ingin merencanakan liburan ke Bali selama 5 hari..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
              required
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Jelaskan secara detail apa yang ingin Anda capai
            </p>
          </div>

          {/* Task Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="minTasks"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Minimum Tugas
              </label>
              <input
                type="number"
                id="minTasks"
                value={minTasks}
                onChange={(e) =>
                  setMinTasks(Math.max(1, parseInt(e.target.value) || 1))
                }
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                disabled={isGenerating}
              />
            </div>
            <div>
              <label
                htmlFor="maxTasks"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Maksimum Tugas
              </label>
              <input
                type="number"
                id="maxTasks"
                value={maxTasks}
                onChange={(e) => {
                  const value = Math.max(
                    minTasks,
                    parseInt(e.target.value) || minTasks
                  );
                  setMaxTasks(Math.min(20, value));
                }}
                min={minTasks}
                max="20"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Info */}
          {!successMessage && !errorMessage && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  <p className="font-medium mb-1">Tips untuk hasil terbaik:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Berikan konteks yang jelas dan spesifik</li>
                    <li>• Sebutkan timeline atau deadline jika ada</li>
                    <li>• Jelaskan tujuan akhir yang ingin dicapai</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!description.trim() || isGenerating}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
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
                  <span>Generate Tugas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
