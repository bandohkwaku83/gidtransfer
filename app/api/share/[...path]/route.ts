import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Demo frontend — share API is implemented in `lib/share-gallery-api` against local data. */
export async function GET(
  _request: NextRequest,
  _context: { params: Promise<{ path: string[] }> },
) {
  return NextResponse.json({ message: "Share API route is disabled in demo mode." }, { status: 404 });
}

export async function POST(
  _request: NextRequest,
  _context: { params: Promise<{ path: string[] }> },
) {
  return NextResponse.json({ message: "Share API route is disabled in demo mode." }, { status: 404 });
}

export async function DELETE(
  _request: NextRequest,
  _context: { params: Promise<{ path: string[] }> },
) {
  return NextResponse.json({ message: "Share API route is disabled in demo mode." }, { status: 404 });
}
