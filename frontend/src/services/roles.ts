
import { supabase } from "../lib/supabase";

export type AppRole =
  | "administrator"
  | "inventory_manager"
  | "viewer";

const VALID_ROLES: AppRole[] = [
  "administrator",
  "inventory_manager",
  "viewer",
];

export async function getCurrentUserRole(): Promise<AppRole> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unable to verify the authenticated user.");
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Unable to retrieve your application role.");
  }

  if (!VALID_ROLES.includes(data.role as AppRole)) {
    throw new Error("Invalid application role.");
  }

  return data.role as AppRole;
}