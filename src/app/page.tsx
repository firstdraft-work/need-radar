"use client";

import { useState, useEffect, useCallback } from "react";
import SearchForm from "@/components/SearchForm";
import ResultsList from "@/components/ResultsList";
import InviteModal from "@/components/InviteModal";
import UpgradeModal from "@/components/UpgradeModal";
import RadarLoader from "@/components/RadarLoader";
import Footer from "@/components/Footer";
import { SearchResult } from "@/lib/types";

function getInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("invite_code");
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  // 邀请码状态
  const [inviteVerified, setInviteVerified] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 使用次数状态（来自服务端）
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 搜索阶段提示
  const [searchPhase, setSearchPhase] = useState("");

  // 是否已搜索过（控制 Hero 区收缩）
  const [hasSearched, setHasSearched] = useState(false);

  // 初始化：检查邀请码 + 获取服务端用量
  useEffect(() => {
    const code = getInviteCode();
    if (code) {
      setInviteVerified(true);
      // Fetch server-side usage
      fetch(`/api/usage?code=${encodeURIComponent(code)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.remaining !== undefined) {
            setRemainingCount(data.remaining);
          }
        })
        .catch(() => {
          // If usage check fails, allow search anyway
        });
    } else {
      setShowInviteModal(true);
    }
  }, []);

  const handleInviteSuccess = useCallback((code: string) => {
    setInviteVerified(true);
    setShowInviteModal(false);
    // Fetch usage for new code
    fetch(`/api/usage?code=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.remaining !== undefined) {
          setRemainingCount(data.remaining);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (keyword: string) => {
    if (!inviteVerified) return;
    if (remainingCount !== null && remainingCount <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSearchTime(null);
    setHasSearched(true);
    const startTime = Date.now();

    const phase1 = setTimeout(() => setSearchPhase("正在搜索 Reddit..."), 500);
    const phase2 = setTimeout(() => setSearchPhase("正在搜索 Product Hunt..."), 2000);
    const phase3 = setTimeout(() => setSearchPhase("AI 正在分析需求..."), 4000);

    try {
      const inviteCode = getInviteCode() ?? "";
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(keyword)}&code=${encodeURIComponent(inviteCode)}`
      );

      if (res.status === 429) {
        setRemainingCount(0);
        setShowUpgradeModal(true);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `请求失败 (${res.status})`);
      }

      const data: SearchResult & { errors?: string[] } = await res.json();
      setResult(data);

      // Update remaining count from server
      if (inviteCode) {
        try {
          const usageRes = await fetch(`/api/usage?code=${encodeURIComponent(inviteCode)}`);
          const usageData = await usageRes.json();
          if (usageData.remaining !== undefined) {
            setRemainingCount(usageData.remaining);
          }
        } catch {
          // Silently ignore usage check failure
        }
      }

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
    <main className="flex-1 flex flex-col items-center">
      {/* 邀请码弹窗 */}
      {showInviteModal && !inviteVerified && (
        <InviteModal onSuccess={handleInviteSuccess} />
      )}

      {/* 升级弹窗 */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Hero 区域 - 搜索后收缩 */}
      <section
        className={`w-full hero-mesh transition-all duration-500 ${
          hasSearched ? "pt-8 pb-6" : "pt-16 pb-12 sm:pt-24 sm:pb-16"
        }`}
      >
        <div className="max-w-2xl mx-auto px-4 text-center">
          {/* Logo + 标题 */}
          <div className={`transition-all duration-500 ${hasSearched ? "mb-4" : "mb-6"}`}>
            {/* 雷达图标 */}
            <div className={`inline-flex items-center justify-center rounded-2xl mb-4 transition-all duration-500 ${
              hasSearched ? "w-10 h-10 bg-blue-600/10 dark:bg-blue-400/10" : "w-16 h-16 bg-blue-600/10 dark:bg-blue-400/10"
            }`}>
              <svg
                className={`text-blue-600 dark:text-blue-400 transition-all duration-500 ${hasSearched ? "w-5 h-5" : "w-8 h-8"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>

            <h1 className={`font-bold tracking-tight transition-all duration-500 ${
              hasSearched ? "text-xl sm:text-2xl" : "text-3xl sm:text-5xl"
            }`}>
              <span className="brand-gradient">AI 需求雷达</span>
            </h1>

            {!hasSearched && (
              <p className="mt-3 text-[var(--muted)] text-base sm:text-lg max-w-md mx-auto">
                从全网噪音中自动发现值得做的产品机会
              </p>
            )}
          </div>

          {/* 搜索表单 */}
          <SearchForm
            onSearch={handleSearch}
            loading={loading}
            disabled={!inviteVerified}
            remainingCount={remainingCount ?? undefined}
            onUpgradeClick={() => setShowUpgradeModal(true)}
            compact={hasSearched}
          />

          {/* 剩余次数 - 仅搜索后显示 */}
          {inviteVerified && hasSearched && remainingCount !== null && (
            <div className="mt-2 text-xs text-[var(--muted)]">
              剩余{" "}
              <span
                className={`font-semibold ${
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

          {/* 信任指标 - 仅首次显示 */}
          {!hasSearched && (
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
                </svg>
                Reddit 实时数据
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 0 0 0-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 16.8H10.2V18H8.4V6h5.204a3.6 3.6 0 0 1 0 7.2h-2.809v3.6h2.809V18h1.804v-1.2h-.004z"/>
                </svg>
                Product Hunt
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[var(--accent-green)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI 智能评分
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 结果区域 */}
      <div className="w-full max-w-2xl mx-auto px-4 pb-8">
        {loading && <RadarLoader phase={searchPhase} />}

        {error && (
          <div className="text-center py-12 fade-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
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
            <p className="text-red-500 font-semibold text-lg">{error}</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              请检查网络连接，或稍后重试
            </p>
          </div>
        )}

        {result && !loading && (
          <ResultsList result={result} searchTime={searchTime} />
        )}

        {/* 空结果 + 错误提示 */}
        {result && !loading && result.needs.length === 0 && (
          <div className="text-center py-8 fade-up">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-[var(--foreground)] font-semibold mb-1">未发现值得做的需求</p>
            <p className="text-sm text-[var(--muted)] mb-3">
              {result.totalRaw > 0
                ? `扫描了 ${result.totalRaw} 条帖子，AI 过滤后没有发现高质量需求信号`
                : "未搜索到相关帖子，试试其他关键词"}
            </p>
            {(result as SearchResult & { errors?: string[] }).errors &&
              (result as SearchResult & { errors?: string[] }).errors!.length > 0 && (
              <div className="text-xs text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 max-w-md mx-auto text-left">
                <p className="font-medium mb-1 text-amber-600 dark:text-amber-400">⚠ 数据源异常：</p>
                {(result as SearchResult & { errors?: string[] }).errors!.map((err, i) => (
                  <p key={i} className="font-mono text-xs break-all">{err}</p>
                ))}
              </div>
            )}
            <div className="mt-4 text-sm text-[var(--muted)]">
              💡 试试这些关键词：<span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => handleSearch("ai writing")}>ai writing</span> · <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => handleSearch("note taking app")}>note taking app</span> · <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => handleSearch("cron job monitor")}>cron job monitor</span>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
