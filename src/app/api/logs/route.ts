import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as habitsApi from "@/lib/api/habits";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const logs = await habitsApi.getLogsForUser(session.user.id, startDate, endDate);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
