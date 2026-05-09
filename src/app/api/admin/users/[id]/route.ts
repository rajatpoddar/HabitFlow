import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { checkAdminRateLimit, getClientIp } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const banSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const { success } = await checkAdminRateLimit(`admin-user-patch:${ip}`);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { action, ...data } = await request.json();

    if (action === "ban") {
      const parsed = banSchema.safeParse(data);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

      await db
        .update(users)
        .set({ isBanned: true, banReason: parsed.data.reason, updatedAt: new Date() })
        .where(eq(users.id, params.id));

      return NextResponse.json({ success: true });
    }

    if (action === "unban") {
      await db
        .update(users)
        .set({ isBanned: false, banReason: null, updatedAt: new Date() })
        .where(eq(users.id, params.id));

      return NextResponse.json({ success: true });
    }

    if (action === "change_plan") {
      if (!["free", "pro", "admin"].includes(data.plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }

      await db
        .update(users)
        .set({ plan: data.plan, updatedAt: new Date() })
        .where(eq(users.id, params.id));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const { success } = await checkAdminRateLimit(`admin-user-delete:${ip}`);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Delete user from DB (cascade handles related data)
    await db.delete(users).where(eq(users.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
