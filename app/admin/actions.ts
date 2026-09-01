"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";

import { createAccount, createBoard, createBoardInvite, deleteUser, getBoardById, getDb, getUserByEmail, redeemBoardInvite, setUserAdmin, updateBoardMemberPermissions, updateBoardMemberRole, updateBoardSettings, updateBrandSettings, type BoardMode, type BoardPurpose, type BoardPermissions, type BoardRole, type BrandSettings } from "@/lib/db";

function id(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function deleteAdminBoardAction(formData: FormData) {
  const admin = await getAdminUser();
  const boardId = id(formData.get("boardId"));
  if (!admin || !boardId) return { error: "Admin access required" };
  getDb().prepare("DELETE FROM boards WHERE id = ?").run(boardId);
  revalidatePath("/admin");
  return { ok: true };
}

export async function createAdminUserAction(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) return { error: "Admin access required" };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return { error: "Enter a name, valid email, and password of at least 8 characters" };
  if (getUserByEmail(email)) return { error: "An account with that email already exists" };
  const user = createAccount(name, email, password);
  if (formData.get("isAdmin") === "on") setUserAdmin(user.id, true);
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateAdminUserAction(formData: FormData) {
  const admin = await getAdminUser();
  const userId = id(formData.get("userId"));
  if (!admin || !userId) return { error: "Admin access required" };
  if (userId === admin.id && formData.get("isAdmin") !== "on") return { error: "You cannot remove your own admin access" };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid name and email" };
  const existing = getUserByEmail(email);
  if (existing && existing.id !== userId) return { error: "That email is already in use" };
  getDb().prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, userId);
  setUserAdmin(userId, formData.get("isAdmin") === "on");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteAdminUserAction(formData: FormData) {
  const admin = await getAdminUser();
  const userId = id(formData.get("userId"));
  if (!admin || !userId) return { error: "Admin access required" };
  if (userId === admin.id) return { error: "You cannot delete your own admin account" };
  try {
    if (!deleteUser(userId)) return { error: "Account not found" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Account cannot be deleted" };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function createAdminBoardAction(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) return { error: "Admin access required" };
  const name = String(formData.get("name") ?? "").trim();
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const mode = String(formData.get("mode") ?? "kanban") as BoardMode;
  const purpose = String(formData.get("purpose") ?? "general") as BoardPurpose;
  if (!name) return { error: "Board name is required" };
  const board = createBoard(name, admin.name, mode, purpose);
  updateBoardSettings(board.id, visibility, mode, purpose);
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateBoardSettingsAction(formData: FormData) {
  const admin = await getAdminUser();
  const boardId = id(formData.get("boardId"));
  if (!admin || !boardId) return { error: "Admin access required" };
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const mode = String(formData.get("mode") ?? "kanban") as BoardMode;
  const purpose = String(formData.get("purpose") ?? "general") as BoardPurpose;
  if (!updateBoardSettings(boardId, visibility, mode, purpose)) return { error: "Board not found" };
  revalidatePath("/admin");
  return { ok: true };
}

export async function createBoardInviteAction(formData: FormData) {
  const admin = await getAdminUser();
  const boardId = id(formData.get("boardId"));
  if (!admin || !boardId || !getBoardById(boardId)) return { error: "Admin access required" };
  const role = formData.get("role") === "commenter" ? "commenter" : formData.get("role") === "viewer" ? "viewer" : "editor";
  const permissions: BoardPermissions = { can_view: formData.get("can_view") === "on" ? 1 : 0, can_comment: formData.get("can_comment") === "on" ? 1 : 0, can_interact: formData.get("can_interact") === "on" ? 1 : 0, can_manage: formData.get("can_manage") === "on" ? 1 : 0 };
  return { code: createBoardInvite(boardId, admin.id, role, permissions, 24), ok: true };
}

export async function redeemBoardInviteAction(formData: FormData) {
  const admin = await getAdminUser();
  const code = String(formData.get("code") ?? "").trim();
  if (!admin || !code) return { error: "Sign in and enter a code" };
  const result = redeemBoardInvite(code, admin.id);
  if (!result) return { error: "Code is invalid, expired, or already used" };
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateAdminBrandAction(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) return { error: "Admin access required" };
  const settings: BrandSettings = { name: String(formData.get("name") ?? "").trim(), tagline: String(formData.get("tagline") ?? "").trim(), description: String(formData.get("description") ?? "").trim(), logo: String(formData.get("logo") ?? "").trim(), accent: String(formData.get("accent") ?? "").trim() };
  if (!settings.name || !settings.tagline || !settings.description || !settings.logo || !/^#[0-9a-f]{6}$/i.test(settings.accent)) return { error: "Complete all brand fields and use a hex accent color" };
  updateBrandSettings(settings);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateAdminMemberPermissionsAction(formData: FormData) {
  const admin = await getAdminUser();
  const boardId = id(formData.get("boardId"));
  const userId = id(formData.get("userId"));
  if (!admin || !boardId || !userId) return { error: "Admin access required" };
  const permissions: BoardPermissions = { can_view: formData.get("can_view") === "on" ? 1 : 0, can_comment: formData.get("can_comment") === "on" ? 1 : 0, can_interact: formData.get("can_interact") === "on" ? 1 : 0, can_manage: formData.get("can_manage") === "on" ? 1 : 0 };
  if (formData.get("role") && formData.get("role") !== "owner") updateBoardMemberRole(boardId, userId, formData.get("role") as BoardRole);
  if (!updateBoardMemberPermissions(boardId, userId, permissions)) return { error: "Owner permissions cannot be changed" };
  revalidatePath("/admin");
  return { ok: true };
}

export async function leaveAdminAction() {
  redirect("/");
}
