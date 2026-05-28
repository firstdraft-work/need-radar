"use client";

interface UpgradeModalProps {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">免费查询已用完</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm leading-relaxed">
            免费用户可使用 3 次查询。升级 Pro 即可无限查询，解锁更多数据源和高级筛选功能。
          </p>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              Pro 无限查询
            </div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
              $19<span className="text-base font-normal text-gray-500">/月</span>
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              即将推出
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
