import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as journalApi from "@/lib/api/journal";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const entries = await journalApi.getJournalEntries(session.user.id);
    return NextResponse.json({ entries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { date, ...data } = await request.json();
    const entry = await journalApi.upsertJournalEntry(session.user.id, new Date(date), data);
    return NextResponse.json({ entry });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
