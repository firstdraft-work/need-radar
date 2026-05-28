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
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-400"
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
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
          没有发现高价值需求
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          试试换个更具体的关键词，比如 &quot;AI tools&quot; 或 &quot;SaaS&quot;
        </p>
        <p className="text-xs mt-3 text-gray-400 dark:text-gray-500">
          已扫描 {result.totalRaw} 条帖子，未发现评分 ≥ 3.0 的需求
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
        <span>
          从 {result.totalRaw} 条帖子中筛选出{" "}
          <strong className="text-gray-900 dark:text-gray-100">
            {result.needs.length}
          </strong>{" "}
          个高价值需求
          {searchTime && (
            <span className="text-gray-400 ml-1">· {searchTime}s</span>
          )}
        </span>
        <span className="hidden sm:inline text-gray-400">按评分排序</span>
      </div>
      <div className="flex flex-col gap-4">
        {result.needs.map((need, i) => (
          <ResultCard key={`${need.source}-${i}`} need={need} />
        ))}
      </div>
    </div>
  );
}
