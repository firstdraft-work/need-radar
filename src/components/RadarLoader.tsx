export default function RadarLoader({ phase }: { phase?: string }) {
  return (
    <div className="text-center py-12 fade-up">
      <div className="relative inline-flex items-center justify-center w-24 h-24">
        {/* 外圈 */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-200/60 dark:border-blue-800/60" />
        <div className="absolute inset-3 rounded-full border border-blue-300/40 dark:border-blue-700/40" />
        <div className="absolute inset-6 rounded-full border border-blue-400/30 dark:border-blue-600/30" />

        {/* 旋转扫描线 */}
        <div className="absolute inset-0 radar-spin">
          <div
            className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
            style={{
              background: "linear-gradient(90deg, rgba(37,99,235,0.7), transparent)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: "50%",
              height: "50%",
              marginTop: "-25%",
              background: "conic-gradient(from 0deg, rgba(37,99,235,0.1), transparent 60deg)",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* 中心脉冲点 */}
        <div className="relative w-3 h-3">
          <div className="absolute inset-0 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping opacity-60" />
          <div className="relative w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400" />
        </div>

        {/* 扫描到的点（装饰） */}
        <div className="absolute top-3 right-4 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <div className="absolute bottom-5 left-5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-6 left-3 w-1 h-1 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* 阶段文字 */}
      <div className="mt-6">
        <p className="text-[var(--foreground)] font-medium text-sm">
          {phase || "正在扫描 Reddit 和 Product Hunt..."}
        </p>
        <p className="mt-1 text-[var(--muted)] text-xs">
          AI 正在分析帖子中的产品需求
        </p>
      </div>

      {/* 进度点 */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
