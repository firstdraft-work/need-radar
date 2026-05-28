"use client";

import { useState } from "react";

const SUGGESTIONS = ["AI tools", "SaaS", "productivity", "no code", "developer tools", "writing app"];

interface SearchFormProps {
  onSearch: (keyword: string) => void;
  loading: boolean;
  disabled?: boolean;
  remainingCount?: number;
  onUpgradeClick?: () => void;
}

export default function SearchForm({
  onSearch,
  loading,
  disabled = false,
  remainingCount,
  onUpgradeClick,
}: SearchFormProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) onSearch(query.trim());
  };

  const isOutOfQueries = remainingCount !== undefined && remainingCount <= 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键词，发现产品机会..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-lg"
          disabled={loading || disabled}
        />
        {isOutOfQueries ? (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="px-4 sm:px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            升级 Pro
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || !query.trim() || disabled}
            className="px-4 sm:px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            {loading ? "搜索中..." : "搜索"}
          </button>
        )}
      </form>
      <div className="flex gap-2 mt-3 flex-wrap justify-center">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQuery(s);
              if (!disabled && !isOutOfQueries) onSearch(s);
            }}
            disabled={loading || disabled || isOutOfQueries}
            className="px-3 py-1 text-sm rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
