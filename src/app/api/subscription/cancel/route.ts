import { NextResponse } from "next/server";

// Payments not yet integrated — stub endpoint
export async function POST() {
  return NextResponse.json(
    { error: "Payments coming soon" },
    { status: 503 }
  );
}
