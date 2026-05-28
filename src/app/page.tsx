"use client";

import { useState, useEffect, useCallback } from "react";
import SearchForm from "@/components/SearchForm";
import ResultsList from "@/components/ResultsList";
import InviteModal from "@/components/InviteModal";
import UpgradeModal from "@/components/UpgradeModal";
import RadarLoader from "@/components/RadarLoader";
import Footer from "@/components/Footer";
import { SearchResult } from "@/lib/types";

const FREE_QUERY_LIMIT = 3;

function getInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("invite_code");
}

function getUsedCount(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem("used_count");
  return stored ? parseInt(stored, 10) : 0;
}

function incrementUsedCount(): number {
  const current = getUsedCount();
  const next = current + 1;
  localStorage.setItem("used_count", String(next));
  return next;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  // 邀请码状态
  const [inviteVerified, setInviteVerified] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 使用次数状态
  const [usedCount, setUsedCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 搜索阶段提示
  const [searchPhase, setSearchPhase] = useState("");

  // 初始化：检查邀请码和使用次数
  useEffect(() => {
    const code = getInviteCode();
    if (code) {
      setInviteVerified(true);
    } else {
      setShowInviteModal(true);
    }
    setUsedCount(getUsedCount());
  }, []);

  const remainingCount = FREE_QUERY_LIMIT - usedCount;

  const handleInviteSuccess = useCallback((_code: string) => {
    setInviteVerified(true);
    setShowInviteModal(false);
  }, []);

  const handleSearch = async (keyword: string) => {
    if (!inviteVerified) return;
    if (remainingCount <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSearchTime(null);
    const startTime = Date.now();

    // Simulate phase updates for better UX
    const phase1 = setTimeout(() => setSearchPhase("正在搜索 Reddit..."), 500);
    const phase2 = setTimeout(() => setSearchPhase("正在搜索 Product Hunt..."), 2000);
    const phase3 = setTimeout(() => setSearchPhase("AI 正在分析需求..."), 4000);

    try {
      const inviteCode = getInviteCode() ?? "";
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(keyword)}&code=${encodeURIComponent(inviteCode)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `请求失败 (${res.status})`);
      }
      const data: SearchResult = await res.json();
      setResult(data);

      // 搜索成功后增加使用次数
      const newCount = incrementUsedCount();
      setUsedCount(newCount);

      setSearchTime(Math.round((Date.now() - startTime) / 1000));
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索出错，请稍后重试");
    } finally {
      clearTimeout(phase1);
      clearTimeout(phase2);
      clearTimeout(phase3);
      setSearchPhase("");
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
      {/* 邀请码弹窗 */}
      {showInviteModal && !inviteVerified && (
        <InviteModal onSuccess={handleInviteSuccess} />
      )}

      {/* 升级弹窗 */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}

      <header className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
          <span className="text-blue-600">AI</span> 需求雷达
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
          从全网噪音中自动发现值得做的产品机会
        </p>
      </header>

      {/* 剩余次数提示 */}
      {inviteVerified && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          剩余{" "}
          <span
            className={`font-bold ${
              remainingCount > 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-500"
            }`}
          >
            {remainingCount}
          </span>{" "}
          次免费查询
        </div>
      )}

      <SearchForm
        onSearch={handleSearch}
        loading={loading}
        disabled={!inviteVerified}
        remainingCount={remainingCount}
        onUpgradeClick={() => setShowUpgradeModal(true)}
      />

      <div className="w-full max-w-2xl mt-8 sm:mt-10">
        {loading && <RadarLoader phase={searchPhase} />}

        {error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-red-500 font-medium">{error}</p>
            <p className="text-sm text-gray-400 mt-2">
              请检查网络连接，或稍后重试
            </p>
          </div>
        )}

        {result && !loading && (
          <ResultsList result={result} searchTime={searchTime} />
        )}
      </div>

      <Footer />
    </main>
  );
}
