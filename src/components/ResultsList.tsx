import { SearchResult } from "@/lib/types";
import ResultCard from "./ResultCard";

export default function ResultsList({
  result,
  searchTime,
}: {
  result: SearchResult;
  searchTime?: number | null;
}) {
  if (result.needs.length === 0) {
    return (
      <div className="text-center py-16 fade-up">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold text-[var(--foreground)] mb-2">
          没有发现高价值需求
        </p>
        <p className="text-sm text-[var(--muted)]">
          试试换个更具体的关键词，比如 &quot;AI tools&quot; 或 &quot;SaaS&quot;
        </p>
        <p className="text-xs mt-3 text-[var(--muted)]">
          已扫描 {result.totalRaw} 条帖子，未发现评分 ≥ 3.0 的需求
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 结果统计条 */}
      <div className="flex items-center justify-between mb-5 text-sm text-[var(--muted)]">
        <span>
          从 <span className="font-mono tabular-nums">{result.totalRaw}</span> 条帖子中筛选出{" "}
          <strong className="text-[var(--foreground)]">
            {result.needs.length}
          </strong>{" "}
          个高价值需求
          {searchTime && (
            <span className="ml-2 text-xs opacity-60">耗时 {searchTime}s</span>
          )}
        </span>
        <span className="hidden sm:flex items-center gap-1 text-xs text-[var(--muted)]">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
          </svg>
          按评分排序
        </span>
      </div>

      {/* 结果卡片列表 */}
      <div className="flex flex-col gap-4">
        {result.needs.map((need, i) => (
          <ResultCard key={`${need.source}-${i}`} need={need} index={i} />
        ))}
      </div>
    </div>
  );
}
