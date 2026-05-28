"use client";

import { useState } from "react";

const SUGGESTIONS = [
  { label: "ai writing", emoji: "✍️" },
  { label: "note taking app", emoji: "📝" },
  { label: "cron job monitor", emoji: "⏰" },
  { label: "invoice generator", emoji: "🧾" },
  { label: "landing page builder", emoji: "🚀" },
  { label: "email automation", emoji: "📧" },
];

interface SearchFormProps {
  onSearch: (keyword: string) => void;
  loading: boolean;
  disabled?: boolean;
  remainingCount?: number;
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export default function SearchForm({
  onSearch,
  loading,
  disabled = false,
  remainingCount,
  onUpgradeClick,
  compact = false,
}: SearchFormProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) onSearch(query.trim());
  };

  const isOutOfQueries = remainingCount !== undefined && remainingCount <= 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* 搜索框容器 */}
        <div className="relative search-glow rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-200">
          <div className="flex items-center">
            {/* 搜索图标 */}
            <div className="pl-4 pr-2 text-[var(--muted)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词，发现产品机会..."
              className={`flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none ${
                compact ? "py-2.5 text-sm" : "py-3.5 text-base sm:text-lg"
              }`}
              disabled={loading || disabled}
            />

            {/* 搜索按钮 */}
            <div className="pr-2">
              {isOutOfQueries ? (
                <button
                  type="button"
                  onClick={onUpgradeClick}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all text-sm whitespace-nowrap"
                >
                  ⚡ 升级 Pro
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !query.trim() || disabled}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      搜索中
                    </span>
                  ) : (
                    "搜索"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 加载时底部进度条 */}
          {loading && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
              <div className="h-full shimmer" />
            </div>
          )}
        </div>
      </form>

      {/* 关键词建议 */}
      {!compact && (
        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setQuery(s.label);
                if (!disabled && !isOutOfQueries) onSearch(s.label);
              }}
              disabled={loading || disabled || isOutOfQueries}
              className="tag-pill px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span className="mr-1">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
