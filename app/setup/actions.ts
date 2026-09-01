"use server";

import { redirect } from "next/navigation";
import { countAdmins, createAccount, getUserByEmail, setUserAdmin } from "@/lib/db";

function value(formData: FormData, key: string): string {
  return typeof formData.get(key) === "string" ? String(formData.get(key)).trim() : "";
}

export async function createFirstAdminAction(formData: FormData) {
  if (countAdmins() > 0) return { error: "Initial admin setup has already been completed" };
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return { error: "Enter a name, valid email, and password of at least 8 characters" };
  const existing = getUserByEmail(email);
  if (existing) return { error: "That email already exists. Sign in with it or choose another email." };
  const user = createAccount(name, email, password);
  setUserAdmin(user.id, true);
  redirect("/auth?next=/admin");
}
