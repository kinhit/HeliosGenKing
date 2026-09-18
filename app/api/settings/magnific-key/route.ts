import { NextRequest, NextResponse } from "next/server";
import {
  deleteMagnificApiKey,
  getMagnificApiKey,
  setMagnificApiKey,
} from "@/lib/guest/db";

export async function GET() {
  return NextResponse.json({ hasToken: !!getMagnificApiKey() });
}

export async function POST(req: NextRequest) {
  const { magnificApiKey } = await req.json();
  if (typeof magnificApiKey !== "string" || !magnificApiKey.trim()) {
    return NextResponse.json({ error: "magnificApiKey is required" }, { status: 400 });
  }
  setMagnificApiKey(magnificApiKey.trim());
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  deleteMagnificApiKey();
  return NextResponse.json({ ok: true });
}

