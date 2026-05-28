import { NextRequest, NextResponse } from "next/server";
import { getUsage, incrementUsage } from "@/lib/usage";

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
