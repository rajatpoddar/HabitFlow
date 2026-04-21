import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

function toUser(sbUser: any, profile?: any): User {
  return {
    id: sbUser.id,
    name:
      profile?.name ||
      sbUser.user_metadata?.name ||
      sbUser.email?.split("@")[0] ||
      "User",
    email: sbUser.email,
    avatar: profile?.avatar_url || sbUser.user_metadata?.avatar_url,
    plan: profile?.plan ?? "free",
    created_at: sbUser.created_at,
    updated_at: sbUser.updated_at || sbUser.created_at,
  };
}

export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);

  const profile = await getProfile(data.user.id);
  return toUser(data.user, profile);
}

export async function signup(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Signup failed");
  return toUser(data.user, { name, plan: "free" });
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const profile = await getProfile(data.user.id);
  return toUser(data.user, profile);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) console.warn("[getProfile] error:", error.message, "| code:", error.code);
  return data;
}

export async function updateProfile(
  userId: string,
  data: Partial<{ name: string; email: string }>
): Promise<User> {
  // Update Supabase Auth metadata
  const updateData: any = {};
  if (data.name) updateData.data = { name: data.name };
  if (data.email) updateData.email = data.email;

  const { data: updated, error } = await supabase.auth.updateUser(updateData);
  if (error) throw new Error(error.message);

  // Update user_profiles table
  if (data.name) {
    await supabase
      .from("user_profiles")
      .update({ name: data.name })
      .eq("id", userId);
  }

  const profile = await getProfile(userId);
  return toUser(updated.user, profile);
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function deleteAccount(userId: string): Promise<void> {
  // Mark as banned (soft delete) — hard delete requires service role
  const { error } = await supabase
    .from("user_profiles")
    .update({ is_banned: true, ban_reason: "User requested account deletion" })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}
