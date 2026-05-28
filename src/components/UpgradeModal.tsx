"use client";

interface UpgradeModalProps {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] rounded-2xl shadow-2xl p-8 max-w-md w-full border border-[var(--border)]">
        <div className="text-center">
          {/* 闪电图标 */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-[var(--foreground)]">免费查询已用完</h2>
          <p className="text-[var(--muted)] mt-3 text-sm leading-relaxed">
            免费用户可使用 3 次查询。升级 Pro 即可无限查询，解锁更多数据源和高级筛选功能。
          </p>

          {/* Pro 定价卡 */}
          <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-800/60">
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
              Pro 无限查询
            </div>
            <div className="text-3xl font-extrabold text-[var(--foreground)]">
              $19<span className="text-base font-normal text-[var(--muted)]">/月</span>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              即将推出
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--surface-hover)] transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
