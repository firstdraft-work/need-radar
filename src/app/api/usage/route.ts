import { NextRequest, NextResponse } from "next/server";

const FREE_QUERY_LIMIT = 3;

// 简单内存存储（MVP 阶段，重启后重置）
const usageMap = new Map<string, number>();

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "缺少邀请码参数" }, { status: 400 });
  }

  const used = usageMap.get(code) ?? 0;
  const remaining = Math.max(0, FREE_QUERY_LIMIT - used);

  return NextResponse.json({
    used,
    limit: FREE_QUERY_LIMIT,
    remaining,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code: string | undefined = body.code;

  if (!code) {
    return NextResponse.json({ error: "缺少邀请码" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();
  const current = usageMap.get(normalizedCode) ?? 0;
  const newCount = current + 1;
  usageMap.set(normalizedCode, newCount);

  const remaining = Math.max(0, FREE_QUERY_LIMIT - newCount);

  return NextResponse.json({
    used: newCount,
    limit: FREE_QUERY_LIMIT,
    remaining,
  });
}
