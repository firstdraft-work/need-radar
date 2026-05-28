import { ScoredNeed } from "@/lib/types";

function getScoreConfig(score: number) {
  if (score >= 4) {
    return {
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      barBg: "bg-emerald-500",
      dot: "bg-emerald-500",
      label: "强烈需求",
    };
  }
  if (score >= 3) {
    return {
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      barBg: "bg-amber-500",
      dot: "bg-amber-500",
      label: "值得关注",
    };
  }
  return {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    barBg: "bg-red-500",
    dot: "bg-red-500",
    label: "信号较弱",
  };
}

function ScoreBar({ value, colorClass }: { value: number; colorClass: string }) {
  const pct = (value / 5) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[var(--muted)] font-mono tabular-nums w-7">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

const SOURCE_CONFIG = {
  reddit: {
    icon: (
      <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    label: "Reddit",
    badgeClass: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  },
  producthunt: {
    icon: (
      <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 0 0 0-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 16.8H10.2V18H8.4V6h5.204a3.6 3.6 0 0 1 0 7.2h-2.809v3.6h2.809V18h1.804v-1.2h-.004z" />
      </svg>
    ),
    label: "Product Hunt",
    badgeClass: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  },
};

export default function ResultCard({ need, index }: { need: ScoredNeed; index: number }) {
  const sourceConfig = SOURCE_CONFIG[need.source];
  const scoreConfig = getScoreConfig(need.score);

  return (
    <div
      className="card-lift rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* 顶部行：来源 + 评分 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${sourceConfig.badgeClass}`}>
            {sourceConfig.icon}
            {sourceConfig.label}
          </span>
          {need.subreddit && (
            <span className="text-xs text-[var(--muted)]">r/{need.subreddit}</span>
          )}
          {need.tagline && (
            <span className="text-xs text-[var(--muted)] truncate max-w-[180px]">{need.tagline}</span>
          )}
        </div>

        {/* 评分徽章 */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold border ${scoreConfig.bg} ${scoreConfig.border} ${scoreConfig.color} ${
          need.score >= 4 ? "score-badge-high" : ""
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${scoreConfig.dot}`} />
          {need.score.toFixed(1)}
        </div>
      </div>

      {/* 标题 */}
      <h3 className="font-semibold text-[var(--foreground)] mb-2 line-clamp-2 text-[15px] leading-snug">
        {need.title}
      </h3>

      {/* 痛点描述 */}
      <p className="text-sm text-[var(--muted)] mb-4 line-clamp-3 leading-relaxed">
        {need.painPoint}
      </p>

      {/* 评分维度 */}
      <div className="flex items-center gap-5 text-xs mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--muted)]">需求明确度</span>
          <ScoreBar value={need.clarity} colorClass={scoreConfig.barBg} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--muted)]">市场信号</span>
          <ScoreBar value={need.marketSignal} colorClass={scoreConfig.barBg} />
        </div>
      </div>

      {/* 底部行：互动数据 + 链接 */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
            </svg>
            {need.upvotes.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            {need.comments}
          </span>
          <span className={`font-medium ${scoreConfig.color}`}>{scoreConfig.label}</span>
        </div>

        <a
          href={need.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          查看原文
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}
