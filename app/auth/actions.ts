"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { consumeAuthToken, createAccount, createAuthToken, createSession, deleteSession, getUserByEmail, getUserById, markEmailVerified, setUserAccount, verifyPassword } from "@/lib/db";

function value(formData: FormData, key: string): string { return typeof formData.get(key) === "string" ? String(formData.get(key)).trim() : ""; }

function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

async function setSession(userId: number) {
  const store = await cookies();
  store.set("boardly_session", createSession(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function signUpAction(formData: FormData) {
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (!name || !email || !password) return { error: "Name, email, and password are required" };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  if (getUserByEmail(email)) return { error: "An account with that email already exists" };
  const user = createAccount(name, email, password);
  const verifyToken = createAuthToken(user.id, "verify_email");
  console.info(`[Boardly] Email verification link: /auth/verify?token=${verifyToken}`);
  await setSession(user.id);
  redirect(safeNext(value(formData, "next")));
}

export async function signInAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const user = getUserByEmail(email);
  if (!user?.password_hash || !verifyPassword(password, user.password_hash)) return { error: "Invalid email or password" };
  await setSession(user.id);
  redirect(safeNext(value(formData, "next")));
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const user = getUserByEmail(email);
  if (user) {
    const token = createAuthToken(user.id, "reset_password");
    console.info(`[Boardly] Password reset link: /auth/reset?token=${token}`);
  }
  return { ok: true, message: "If an account exists, a reset link has been generated." };
}

export async function verifyEmailAction(token: string) {
  const userId = consumeAuthToken(token, "verify_email");
  if (!userId) return { error: "This verification link is invalid or expired" };
  markEmailVerified(userId);
  return { ok: true };
}

export async function resetPasswordAction(formData: FormData) {
  const token = value(formData, "token");
  const password = value(formData, "password");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  const userId = consumeAuthToken(token, "reset_password");
  if (!userId) return { error: "This reset link is invalid or expired" };
  const user = getUserById(userId);
  if (!user?.email) return { error: "Account email is missing" };
  setUserAccount(userId, user.email, password);
  return { ok: true };
}

export async function signOutAction() {
  const store = await cookies();
  const session = store.get("boardly_session")?.value;
  if (session) deleteSession(session);
  store.delete("boardly_session");
  redirect("/");
}
