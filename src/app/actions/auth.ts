"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validations";

export async function signupAction(formData: any) {
  const parsed = signupSchema.safeParse(formData);
  
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return { error: "User already exists with this email" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      plan: "free",
    });

    return { success: true };
  } catch (err) {
    console.error("Signup error:", err);
    return { error: "Something went wrong during signup" };
  }
}
