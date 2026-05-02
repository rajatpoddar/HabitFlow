import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as habitsApi from "@/lib/api/habits";
import { createHabitSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const habits = await habitsApi.getHabits(session.user.id);
    return NextResponse.json({ habits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createHabitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }

    const habit = await habitsApi.createHabit({ ...parsed.data, user_id: session.user.id });
    return NextResponse.json({ habit }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
