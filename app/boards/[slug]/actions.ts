"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  addActivity, addNote, assignTask, createBoard, createTask, deleteTask, getBoardBySlug,
  canRole, getBoardDocument, getBoardMember, getTaskById, getUserById, joinBoard, listActivity, listTasks, moveTask, restoreTask, setTaskLabels,
  listBoardMembers, removeBoardMember, touchUser, updateBoardDocument, updateBoardMemberRole, updateTask, updateTaskStatus, getUserBySession,
} from "@/lib/db";
import type { Board, BoardRole, Task, TaskPriority, User } from "@/lib/db";

interface Session { board: Board; user: User }

async function setSessionCookies(userId: number, userName: string) {
  const cookieStore = await cookies();
  cookieStore.set("tb_user_id", String(userId), { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  cookieStore.set("tb_user_name", userName, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
}

async function getSessionForBoard(slug: string): Promise<Session | null> {
  const board = getBoardBySlug(slug);
  if (!board) return null;
  const store = await cookies();
  const sessionId = store.get("boardly_session")?.value;
  const sessionUser = sessionId ? getUserBySession(sessionId) : null;
  const raw = store.get("tb_user_id")?.value;
  const userId = raw ? Number(raw) : NaN;
  const user = sessionUser ?? (Number.isInteger(userId) ? getUserById(userId) : null);
  if (!user || !getBoardMember(board.id, user.id)) return null;
  touchUser(user.id);
  return { board, user };
}

async function authorizedTask(slug: string, taskId: number, permission: "read" | "comment" | "edit" | "manage" = "read") {
  const session = await getSessionForBoard(slug);
  const task = Number.isInteger(taskId) ? getTaskById(taskId) : null;
  const membership = session && getBoardMember(session.board.id, session.user.id);
  return session && membership && canRole(membership.role, permission) && task && task.board_id === session.board.id ? { session, task, membership } : null;
}


function positiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
function text(value: FormDataEntryValue | null): string { return typeof value === "string" ? value.trim() : ""; }
function priority(value: FormDataEntryValue | null): TaskPriority { return value === "low" || value === "high" ? value : "medium"; }

export async function createBoardAction(formData: FormData) {
  const name = text(formData.get("name"));
  const store = await cookies();
  const sessionId = store.get("boardly_session")?.value;
  const sessionUser = sessionId ? getUserBySession(sessionId) : null;
  if (!sessionUser) redirect(`/auth?next=${encodeURIComponent("/")}`);
  if (!sessionUser.is_admin) return { error: "Only administrators can create boards" };
  if (!name) return { error: "Board name is required" };
  const board = createBoard(name, sessionUser.name, "kanban", "general", sessionUser.id);
  await setSessionCookies(board.created_by, sessionUser.name);
  revalidatePath("/");
  redirect(`/boards/${board.slug}`);
}

export async function joinBoardAction(formData: FormData) {
  const slug = text(formData.get("slug")).replace(/^.*\/boards\//, "").replace(/\/$/, "");
  const store = await cookies();
  const sessionId = store.get("boardly_session")?.value;
  const sessionUser = sessionId ? getUserBySession(sessionId) : null;
  if (!sessionUser) redirect(`/auth?next=${encodeURIComponent(`/boards/${slug}`)}`);
  if (!slug) return { error: "Board link is required" };
  if (!getBoardBySlug(slug)) return { error: "Board not found" };
  const user = joinBoard(slug, sessionUser.name, sessionUser.id);
  await setSessionCookies(user.id, sessionUser.name);
  revalidatePath(`/boards/${slug}`);
  redirect(`/boards/${slug}`);
}

export async function joinBoardFromPageAction(formData: FormData) { return joinBoardAction(formData); }

export async function addTaskAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const title = text(formData.get("title"));
  const session = await getSessionForBoard(slug);
  if (!session || !canRole(getBoardMember(session.board.id, session.user.id)?.role ?? "viewer", "edit")) return { error: "Editor access is required" };
  const assigneeId = formData.get("assigneeId") ? positiveInt(formData.get("assigneeId")) : null;
  if (!title) return { error: "Title is required" };
  if (formData.get("assigneeId") && assigneeId == null) return { error: "Invalid assignee" };
  const assignee = assigneeId == null ? null : getUserById(assigneeId);
  if (assigneeId != null && (!assignee || assignee.board_id !== session.board.id)) return { error: "Invalid assignee" };
  const task = createTask(session.board.id, { title, assigneeId });
  addActivity(session.board.id, session.user.id, "created_task", `Added ${task.title}`);
  revalidatePath(`/boards/${slug}`);
  return { task, ok: true };
}

export async function updateTaskLabelsAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const taskId = positiveInt(formData.get("taskId"));
  const labels = text(formData.get("labels")).split(",").map(label => label.trim()).filter(Boolean).slice(0, 8);
  if (!taskId) return { error: "Invalid task" };
  const access = await authorizedTask(slug, taskId, "edit");
  if (!access) return { error: "Task not found" };
  const cleanLabels = [...new Set(labels)].filter(label => /^[\w -]{1,24}$/u.test(label));
  const result = setTaskLabels(taskId, cleanLabels);
  addActivity(access.session.board.id, access.session.user.id, "updated_labels", `Updated labels for ${access.task.title}`);
  revalidatePath(`/boards/${slug}`);
  return { labels: result, ok: true };
}

export async function updateTaskAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const taskId = positiveInt(formData.get("taskId"));
  if (!taskId) return { error: "Invalid task" };
  const access = await authorizedTask(slug, taskId, "edit");
  if (!access) return { error: "Task not found" };
  const result = updateTask(taskId, { title: text(formData.get("title")), description: text(formData.get("description")), priority: priority(formData.get("priority")), dueDate: text(formData.get("dueDate")) || null });
  addActivity(access.session.board.id, access.session.user.id, "updated_task", `Updated ${access.task.title}`);
  revalidatePath(`/boards/${slug}`);
  return { task: result, ok: true };
}

export async function toggleTaskAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const taskId = positiveInt(formData.get("taskId"));
  if (!taskId) return { error: "Invalid task" };
  const access = await authorizedTask(slug, taskId, "edit");
  if (!access) return { error: "Task not found" };
  const next: Record<Task["status"], Task["status"]> = { todo: "in_progress", in_progress: "done", done: "todo" };
  const status = next[access.task.status];
  updateTaskStatus(taskId, status, status === "done" ? new Date().toISOString() : null);
  addActivity(access.session.board.id, access.session.user.id, "changed_stage", `Moved ${access.task.title} to ${status.replace("_", " ")}`);
  revalidatePath(`/boards/${slug}`);
  return { ok: true };
}

export async function moveTaskAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const taskId = positiveInt(formData.get("taskId"));
  const position = Number(formData.get("position"));
  const status = formData.get("status");
  if (!taskId || (status !== "todo" && status !== "in_progress" && status !== "done") || !Number.isFinite(position)) return { error: "Invalid task position" };
  const access = await authorizedTask(slug, taskId, "edit");
  if (!access) return { error: "Task not found" };
  moveTask(taskId, status, position);
  addActivity(access.session.board.id, access.session.user.id, "changed_stage", `Moved ${access.task.title} to ${status.replace("_", " ")}`);
  revalidatePath(`/boards/${slug}`);
  return { ok: true };
}

export async function assignTaskAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const taskId = positiveInt(formData.get("taskId"));
  const assigneeId = formData.get("assigneeId") ? positiveInt(formData.get("assigneeId")) : null;
  if (!taskId) return { error: "Invalid task" };
  const access = await authorizedTask(slug, taskId, "edit");
  if (!access) return { error: "Task not found" };
  if (assigneeId != null) { const assignee = getUserById(assigneeId); if (!assignee || assignee.board_id !== access.session.board.id) return { error: "Invalid assignee" }; }
  assignTask(taskId, assigneeId);
  addActivity(access.session.board.id, access.session.user.id, "assigned_task", `Updated assignment for ${access.task.title}`);
  revalidatePath(`/boards/${slug}`);
  return { ok: true };
}

export async function addNoteAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const taskId = positiveInt(formData.get("taskId"));
  const noteText = text(formData.get("text"));
  if (!taskId || !noteText) return { error: "Task and note text are required" };
  const access = await authorizedTask(slug, taskId, "comment");
  if (!access) return { error: "Commenter access is required" };
  const note = addNote(taskId, access.session.user.id, noteText);
  addActivity(access.session.board.id, access.session.user.id, "commented", `Commented on ${access.task.title}`);
  revalidatePath(`/boards/${slug}`);
  return { note, ok: true };
}

export async function restoreTaskAction(slug: string, task: Task) {
  const session = await getSessionForBoard(slug);
  const membership = session && getBoardMember(session.board.id, session.user.id);
  if (!session || !membership || !canRole(membership.role, "edit") || session.board.id !== task.board_id) return { error: "Editor access is required" };
  restoreTask(task);
  addActivity(session.board.id, session.user.id, "restored_task", `Restored ${task.title}`);
  revalidatePath(`/boards/${slug}`);
  return { ok: true };
}

export async function deleteTaskAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const taskId = positiveInt(formData.get("taskId"));
  if (!taskId) return { error: "Task not found" };
  const access = await authorizedTask(slug, taskId, "edit");
  if (!access) return { error: "Task not found" };
  deleteTask(taskId);
  addActivity(access.session.board.id, access.session.user.id, "deleted_task", `Deleted ${access.task.title}`);
  revalidatePath(`/boards/${slug}`);
  return { ok: true };
}

export async function updateBoardDocumentAction(slug: string, content: string) {
  const session = await getSessionForBoard(slug);
  if (!session || !canRole(getBoardMember(session.board.id, session.user.id)?.role ?? "viewer", "edit")) return { error: "Editor access is required" };
  if (typeof content !== "string" || content.length > 20000) return { error: "Document is too long" };
  const document = updateBoardDocument(session.board.id, content);
  addActivity(session.board.id, session.user.id, "updated_notes", "Updated board notes");
  revalidatePath(`/boards/${slug}`);
  return { document, ok: true };
}

export async function updateMemberRoleAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const userId = positiveInt(formData.get("userId"));
  const role = formData.get("role");
  if (!userId || (role !== "editor" && role !== "commenter" && role !== "viewer")) return { error: "Invalid member update" };
  const session = await getSessionForBoard(slug);
  const membership = session && getBoardMember(session.board.id, session.user.id);
  if (!session || !membership || !canRole(membership.role, "manage")) return { error: "Owner access is required" };
  if (!updateBoardMemberRole(session.board.id, userId, role as BoardRole)) return { error: "Member role could not be updated" };
  addActivity(session.board.id, session.user.id, "updated_member_role", "Updated a member role");
  revalidatePath(`/boards/${slug}`);
  return { ok: true };
}

export async function removeMemberAction(formData: FormData) {
  const slug = text(formData.get("slug"));
  const userId = positiveInt(formData.get("userId"));
  if (!userId) return { error: "Invalid member" };
  const session = await getSessionForBoard(slug);
  const membership = session && getBoardMember(session.board.id, session.user.id);
  if (!session || !membership || !canRole(membership.role, "manage")) return { error: "Owner access is required" };
  if (!removeBoardMember(session.board.id, userId)) return { error: "Owner cannot be removed" };
  addActivity(session.board.id, session.user.id, "removed_member", "Removed a board member");
  revalidatePath(`/boards/${slug}`);
  return { ok: true };
}

export async function refreshBoardAction(slug: string) {
  const session = await getSessionForBoard(slug);
  if (!session) return { error: "Not a board member" };
  return { tasks: listTasks(session.board.id), document: getBoardDocument(session.board.id), activity: listActivity(session.board.id), members: listBoardMembers(session.board.id), ok: true };
}
