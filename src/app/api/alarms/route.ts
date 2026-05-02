import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as alarmsApi from "@/lib/api/alarms";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const alarms = await alarmsApi.getAlarms(session.user.id);
    return NextResponse.json({ alarms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const alarm = await alarmsApi.upsertAlarm(session.user.id, data);
    return NextResponse.json({ alarm });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
