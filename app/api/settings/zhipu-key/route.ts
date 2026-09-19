import { NextRequest, NextResponse } from "next/server";
import {
  deleteZhipuApiKey,
  getZhipuApiKey,
  setZhipuApiKey,
} from "@/lib/guest/db";

export async function GET() {
  return NextResponse.json({ hasToken: !!getZhipuApiKey() });
}

export async function POST(req: NextRequest) {
  const { zhipuApiKey } = await req.json();
  if (typeof zhipuApiKey !== "string" || !zhipuApiKey.trim()) {
    return NextResponse.json({ error: "zhipuApiKey is required" }, { status: 400 });
  }
  setZhipuApiKey(zhipuApiKey.trim());
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  deleteZhipuApiKey();
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
