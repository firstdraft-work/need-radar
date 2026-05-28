import { NextRequest, NextResponse } from "next/server";

const VALID_CODES = new Set(["RADAR2024", "NEED50", "LAUNCH", "V2EX", "JIKE"]);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code: string | undefined = body.code;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false, error: "请输入邀请码" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  if (VALID_CODES.has(normalizedCode)) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false, error: "邀请码无效" }, { status: 200 });
}
