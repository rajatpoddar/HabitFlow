import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/types";

export async function login(email: string, password: string): Promise<any> {
  // Client-side login call (usually handled by signIn in the component)
  return signIn("credentials", { email, password, redirect: false });
}

export async function logout(): Promise<void> {
  await signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return null;

  return {
    ...user,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  } as unknown as User;
}

export async function getProfile(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user;
}

export async function updateProfile(
  userId: string,
  data: any
): Promise<any> {
  const updated = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  
  return updated[0];
}

export async function deleteAccount(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
  await signOut();
}
