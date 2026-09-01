import { cookies } from "next/headers";
import { getUserBySession, type User } from "@/lib/db";

export function isAdmin(user: User | null): boolean {
  return Boolean(user?.is_admin);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const sessionId = store.get("boardly_session")?.value;
  return sessionId ? getUserBySession(sessionId) : null;
}

export async function getAdminUser(): Promise<User | null> {
  const user = await getCurrentUser();
  return isAdmin(user) ? user : null;
}
