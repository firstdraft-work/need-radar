import { ScoredNeed } from "@/lib/types";

function getScoreColor(score: number): string {
  if (score >= 4) return "text-green-600 dark:text-green-400";
  if (score >= 3) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-amber-500";
  return "bg-red-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 4) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
  if (score >= 3) return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
  return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
}

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 sm:w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getScoreBarColor(value)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6">{value.toFixed(1)}</span>
    </div>
  );
}

const SOURCE_CONFIG = {
  reddit: {
    icon: (
      <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    label: "Reddit",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  producthunt: {
    icon: (
      <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 0 0 0-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 16.8H10.2V18H8.4V6h5.204a3.6 3.6 0 0 1 0 7.2h-2.809v3.6h2.809V18h1.804v-1.2h-.004z" />
      </svg>
    ),
    label: "Product Hunt",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

export default function ResultCard({ need }: { need: ScoredNeed }) {
  const sourceConfig = SOURCE_CONFIG[need.source];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
      <div className="flex items-start gap-3">
        {/* 来源图标 */}
        <div className="mt-0.5 shrink-0">{sourceConfig.icon}</div>

        <div className="flex-1 min-w-0">
          {/* 来源标签 + 子版块/副标题 */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sourceConfig.badgeClass}`}>
              {sourceConfig.label}
            </span>
            {need.subreddit && (
              <span className="text-xs text-gray-400">r/{need.subreddit}</span>
            )}
            {need.tagline && (
              <span className="text-xs text-gray-400 truncate max-w-[200px]">{need.tagline}</span>
            )}
          </div>

          {/* 标题 */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {need.title}
          </h3>

          {/* 痛点描述 */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
            {need.painPoint}
          </p>

          {/* 评分区域 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span>需求明确度</span>
              <ScoreBar value={need.clarity} />
            </div>
            <div className="flex items-center gap-1">
              <span>市场信号</span>
              <ScoreBar value={need.marketSignal} />
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-bold border ${getScoreBgColor(need.score)} ${getScoreColor(need.score)}`}>
              {need.score.toFixed(1)} 分
            </span>
          </div>

          {/* 互动数据 + 链接 */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span>👍 {need.upvotes}</span>
            <span>💬 {need.comments}</span>
            <a
              href={need.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              查看原文 →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
