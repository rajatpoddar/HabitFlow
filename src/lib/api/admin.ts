import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Verifies the calling user is authenticated and has the "admin" plan.
 * Returns the user object on success, or null if unauthorized.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.plan !== "admin") return null;
  return session.user;
}
