import { NextRequest, NextResponse } from "next/server";
import { searchReddit } from "@/lib/reddit";
import { searchProductHunt } from "@/lib/producthunt";
import { filterAndScore } from "@/lib/glm";
import { incrementUsage, isLimitExceeded } from "@/lib/usage";
import { SearchResult } from "@/lib/types";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("q")?.trim();
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();

  if (!keyword) {
    return NextResponse.json({ error: "Parameter 'q' is required" }, { status: 400 });
  }

  // Check usage limit
  if (code) {
    const exceeded = await isLimitExceeded(code);
    if (exceeded) {
      return NextResponse.json(
        { error: "免费查询次数已用完，请升级 Pro" },
        { status: 429 }
      );
    }
  }

  const allPosts: {
    source: "reddit" | "producthunt";
    title: string;
    body: string;
    url: string;
    upvotes: number;
    comments: number;
    subreddit?: string;
    tagline?: string;
    createdAt: string;
  }[] = [];
  const errors: string[] = [];

  const [redditResult, phResult] = await Promise.allSettled([
    searchReddit(keyword, 30),
    searchProductHunt(keyword),
  ]);

  if (redditResult.status === "fulfilled") {
    allPosts.push(...redditResult.value);
  } else {
    const errMsg = redditResult.reason?.message ?? "unknown error";
    console.error("Reddit search error:", errMsg);
    errors.push(`Reddit: ${errMsg}`);
  }

  if (phResult.status === "fulfilled") {
    allPosts.push(...phResult.value);
  } else {
    const errMsg = phResult.reason?.message ?? "unknown error";
    console.error("ProductHunt search error:", errMsg);
    errors.push(`ProductHunt: ${errMsg}`);
  }

  if (allPosts.length === 0) {
    return NextResponse.json({
      keyword,
      needs: [],
      totalRaw: 0,
      filteredOut: 0,
      errors,
    } satisfies SearchResult & { errors: string[] });
  }

  const needs = await filterAndScore(allPosts);

  // Only count usage when we actually return results
  if (code && needs.length > 0) {
    await incrementUsage(code);
  }

  return NextResponse.json({
    keyword,
    needs,
    totalRaw: allPosts.length,
    filteredOut: allPosts.length - needs.length,
    ...(errors.length > 0 ? { errors } : {}),
  } satisfies SearchResult & { errors?: string[] });
}
