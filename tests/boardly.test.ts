import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dbFile = path.join(os.tmpdir(), `boardly-test-${process.pid}-${Date.now()}.db`);
process.env.TODO_DB_PATH = dbFile;

const db = await import("../lib/db.ts");

afterEach(() => {
  db.getDb().exec("DELETE FROM board_activity; DELETE FROM notes; DELETE FROM task_labels; DELETE FROM tasks; DELETE FROM board_documents; DELETE FROM boards; DELETE FROM users;");
});

describe("Boardly database", () => {
  it("creates unique slugs for duplicate board names", () => {
    const first = db.createBoard("Team Planning", "Alex");
    const second = db.createBoard("Team Planning", "Sam");
    assert.equal(first.slug, "team-planning");
    assert.equal(second.slug, "team-planning-2");
  });

  it("creates tasks on the requested board and persists labels", () => {
    const board = db.createBoard("Project", "Alex");
    const task = db.createTask(board.id, { title: "Write docs", priority: "high" });
    assert.equal(task.board_id, board.id);
    assert.deepEqual(db.setTaskLabels(task.id, ["Feature", "Docs"]), ["Docs", "Feature"]);
    assert.deepEqual(db.getTaskById(task.id)?.labels, ["Docs", "Feature"]);
  });

  it("rejects an assignee from a different board", () => {
    const first = db.createBoard("First", "Alex");
    const second = db.createBoard("Second", "Sam");
    const otherUser = db.joinBoard(second.slug, "Taylor");
    assert.throws(() => db.createTask(first.id, { title: "Private task", assigneeId: otherUser.id }), /Assignee/);
  });

  it("enforces role capabilities and protects owners", () => {
    const board = db.createBoard("Permissions", "Owner");
    const editor = db.joinBoard(board.slug, "Editor");
    const commenter = db.joinBoard(board.slug, "Commenter");
    db.addBoardMember(board.id, commenter.id, "commenter");
    assert.equal(db.canRole("owner", "manage"), true);
    assert.equal(db.canRole("editor", "manage"), false);
    assert.equal(db.canRole("commenter", "comment"), true);
    assert.equal(db.canRole("viewer", "edit"), false);
    assert.equal(db.updateBoardMemberRole(board.id, editor.id, "viewer"), true);
    assert.equal(db.getBoardMember(board.id, editor.id)?.role, "viewer");
    assert.equal(db.updateBoardMemberRole(board.id, db.getBoardById(board.id)!.created_by, "viewer"), false);
    assert.equal(db.removeBoardMember(board.id, db.getBoardById(board.id)!.created_by), false);
  });

  it("deletes users safely when nullable references exist", () => {
    const board = db.createBoard("Owned", "Owner");
    const member = db.joinBoard(board.slug, "Member");
    const task = db.createTask(board.id, { title: "Assigned", assigneeId: member.id });
    db.addActivity(board.id, member.id, "commented", "A comment");
    db.addNote(task.id, member.id, "A note");
    assert.equal(db.deleteUser(member.id), true);
    assert.ok(!db.getUserById(member.id));
    assert.equal(db.getDb().prepare("SELECT 1 FROM users WHERE id=?").get(member.id), undefined);
    const assigned = db.getDb().prepare("SELECT assignee_id FROM tasks WHERE id=?").get(task.id) as { assignee_id: number | null } | undefined;
    assert.equal(assigned ? assigned.assignee_id : null, null);
    assert.equal(db.listActivity(board.id).some(item => item.user_id === member.id), false);
  });

  it("moves tasks and records activity", () => {
    const board = db.createBoard("Workflow", "Alex");
    const task = db.createTask(board.id, { title: "Ship feature" });
    const moved = db.moveTask(task.id, "done", 0);
    assert.equal(moved?.status, "done");
    assert.ok(db.listActivity(board.id).some(item => item.action === "changed_stage"));
  });
});

process.on("exit", () => {
  try { db.getDb().close(); } catch {}
  for (const suffix of ["", "-wal", "-shm"]) { try { fs.unlinkSync(`${dbFile}${suffix}`); } catch {} }
});
