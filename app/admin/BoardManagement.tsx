"use client";

import { useState, useTransition } from "react";
import { createAdminBoardAction, createBoardInviteAction, redeemBoardInviteAction, updateBoardSettingsAction } from "./actions";
import type { Board, BoardMode, BoardPurpose } from "@/lib/db";
import styles from "./admin.module.css";

export default function BoardManagement({ boards }: { boards: Board[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const run = (action: (form: FormData) => Promise<{ error?: string; code?: string }>, form: FormData) => startTransition(async () => { const result = await action(form); setMessage(result.error ?? "Saved successfully"); if (result.code) setCode(result.code); });
  return <section className={styles.boardAdminPanel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>Workspaces</p><h2>Create and secure boards</h2><small>Private boards require a one-time access code.</small></div></div><form className={styles.boardCreateForm} onSubmit={event => { event.preventDefault(); run(createAdminBoardAction, new FormData(event.currentTarget)); }}><label className={styles.boardField}><span>Board name</span><input name="name" placeholder="New board name" required maxLength={80} /></label><label className={styles.boardField}><span>Board type</span><select name="mode" defaultValue="kanban"><ModeOptions /></select></label><label className={styles.boardField}><span>Purpose</span><select name="purpose" defaultValue="general"><PurposeOptions /></select></label><label className={styles.boardField}><span>Access</span><select name="visibility" defaultValue="public"><option value="public">Public link</option><option value="private">Private · code required</option></select></label><button className={styles.primary} disabled={pending}>Create board</button></form>{message && <p className={styles.formMessage}>{message}</p>}{boards.map(board => <BoardRow key={board.id} board={board} pending={pending} run={run} code={code} />)}<div className={styles.redeemBox}><h3>Redeem an access code</h3><form onSubmit={event => { event.preventDefault(); run(redeemBoardInviteAction, new FormData(event.currentTarget)); }}><input name="code" placeholder="Enter one-time code" required /><button className={styles.saveSmall} disabled={pending}>Get access</button></form></div></section>;
}

function ModeOptions() { return <>{([["kanban","Kanban"],["list","List"],["calendar","Calendar"],["timeline","Timeline"],["table","Table"],["whiteboard","Whiteboard"],["forms","Forms / Inbox"],["goals","Goals / OKR"],["approval","Approval"],["support","Support"],["crm","CRM pipeline"]] as [BoardMode,string][]).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</> }
function PurposeOptions() { return <>{([["general","General"],["project","Project"],["bug-tracker","Bug tracker"],["content","Content"],["support","Support"],["crm","CRM"],["roadmap","Roadmap"],["personal","Personal"],["goals","Goals"]] as [BoardPurpose,string][]).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</> }

function BoardRow({ board, pending, run, code }: { board: Board; pending: boolean; run: (action: (form: FormData) => Promise<{ error?: string; code?: string }>, form: FormData) => void; code: string }) {
  const [visibility, setVisibility] = useState(board.visibility);
  const [mode, setMode] = useState<BoardMode>(board.mode ?? "kanban");
  const [purpose, setPurpose] = useState<BoardPurpose>(board.purpose ?? "general");
  const update = () => { const form = new FormData(); form.set("boardId", String(board.id)); form.set("visibility", visibility); form.set("mode", mode); form.set("purpose", purpose); run(updateBoardSettingsAction, form); };
  const invite = () => { const form = new FormData(); form.set("boardId", String(board.id)); form.set("role", "editor"); form.set("can_view", "on"); form.set("can_interact", "on"); run(createBoardInviteAction, form); };
  return <div className={styles.boardAdminRow}><div className={styles.boardAdminInfo}><strong>{board.name}</strong><small>/{board.slug} · {mode}</small></div><label className={styles.boardField}><span>Type</span><select value={mode} onChange={event => setMode(event.target.value as BoardMode)}><ModeOptions /></select></label><label className={styles.boardField}><span>Purpose</span><select value={purpose} onChange={event => setPurpose(event.target.value as BoardPurpose)}><PurposeOptions /></select></label><label className={styles.boardField}><span>Access</span><select value={visibility} onChange={event => setVisibility(event.target.value as "public" | "private")}><option value="public">Public</option><option value="private">Private</option></select></label><button className={styles.saveSmall} onClick={update} disabled={pending}>Save</button><button className={styles.saveSmall} onClick={invite} disabled={pending}>Generate code</button>{code && <code className={styles.generatedCode}>{code}</code>}</div>;
}
