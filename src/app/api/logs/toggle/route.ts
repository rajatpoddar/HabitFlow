import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as habitsApi from "@/lib/api/habits";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { habitId, date } = await request.json();
    const log = await habitsApi.toggleHabitLog(habitId, new Date(date), null);
    return NextResponse.json({ log });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
