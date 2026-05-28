export default function RadarLoader({ phase }: { phase?: string }) {
  return (
    <div className="text-center py-12">
      <div className="relative inline-flex items-center justify-center w-24 h-24">
        {/* 外圈雷达扫描 */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800" />
        <div className="absolute inset-2 rounded-full border border-blue-300 dark:border-blue-700" />
        <div className="absolute inset-4 rounded-full border border-blue-400 dark:border-blue-600" />

        {/* 旋转扫描线 */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2s" }}>
          <div
            className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
            style={{
              background: "linear-gradient(90deg, rgba(37,99,235,0.8), transparent)",
            }}
          />
          {/* 扫描扇形 */}
          <div
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: "50%",
              height: "50%",
              marginTop: "-25%",
              background: "conic-gradient(from 0deg, rgba(37,99,235,0.15), transparent 60deg)",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* 中心脉冲点 */}
        <div className="relative w-3 h-3">
          <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75" />
          <div className="relative w-3 h-3 rounded-full bg-blue-600" />
        </div>
      </div>
      <p className="mt-6 text-gray-500 dark:text-gray-400 text-sm">
        {phase || "正在扫描 Reddit 和 Product Hunt..."}
      </p>
      <p className="mt-1 text-gray-400 dark:text-gray-500 text-xs">
        AI 正在分析帖子中的产品需求
      </p>
    </div>
  );
}
