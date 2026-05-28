"use client";

import { useState } from "react";

interface InviteModalProps {
  onSuccess: (code: string) => void;
}

export default function InviteModal({ onSuccess }: InviteModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/verify-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem("invite_code", code.trim().toUpperCase());
        onSuccess(code.trim().toUpperCase());
      } else {
        setError(data.error ?? "邀请码无效");
      }
    } catch {
      setError("验证失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] rounded-2xl shadow-2xl p-8 max-w-md w-full border border-[var(--border)]">
        <div className="text-center mb-6">
          {/* 雷达图标 */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">输入邀请码</h2>
          <p className="text-[var(--muted)] mt-2 text-sm">
            AI 需求雷达目前处于内测阶段
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="请输入邀请码"
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest uppercase"
            autoFocus
            disabled={loading}
          />

          {error && (
            <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "验证中..." : "验证邀请码"}
          </button>
        </form>
      </div>
    </div>
  );
}
