import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Verifies the calling user is authenticated and has the "admin" plan.
 * Returns the user object on success, or null if unauthorized.
 */
export async function requireAdmin(
  supabase: ReturnType<typeof createSupabaseServerClient>
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "admin") return null;
  return user;
}
