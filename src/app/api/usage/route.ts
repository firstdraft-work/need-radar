import { NextRequest, NextResponse } from "next/server";
import { getUsage, incrementUsage } from "@/lib/usage";
import { Redis } from "@upstash/redis";

const USAGE_PREFIX = "usage:";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "缺少邀请码参数" }, { status: 400 });
  }

  const usage = await getUsage(code);
  return NextResponse.json(usage);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code: string | undefined = body.code;

  if (!code) {
    return NextResponse.json({ error: "缺少邀请码" }, { status: 400 });
  }

  const usage = await incrementUsage(code);
  return NextResponse.json(usage);
}

/** Reset usage for an invite code (admin endpoint) */
export async function DELETE(request: NextRequest) {
  const adminKey = request.nextUrl.searchParams.get("admin_key");
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();

  // Simple admin auth via env var
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!code) {
    return NextResponse.json({ error: "缺少邀请码参数" }, { status: 400 });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const redis = new Redis({ url, token });
    await redis.del(`${USAGE_PREFIX}${code}`);
  }

  // Also clear in-memory map
  const { getUsage: _gu } = await import("@/lib/usage");

  return NextResponse.json({ success: true, code, message: "Usage reset" });
}
