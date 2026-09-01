"use client";

import { useState, useTransition } from "react";
import { createAdminUserAction, deleteAdminUserAction, updateAdminBrandAction, updateAdminMemberPermissionsAction, updateAdminUserAction } from "./actions";
import type { Board, User } from "@/lib/db";
import styles from "./admin.module.css";

type Member = User & { role: string; can_view: number; can_comment: number; can_interact: number; can_manage: number };
type Action = (data: FormData) => Promise<{ error?: string }>;

export default function AdminManagement({ users, boards, members, brand }: { users: User[]; boards: Board[]; members: Record<number, Member[]>; brand: { name: string; tagline: string; description: string; logo: string; accent: string } }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const submit = (action: Action, form: HTMLFormElement | FormData) => {
    startTransition(async () => {
      const result = await action(form instanceof FormData ? form : new FormData(form));
      setMessage(result.error ?? "Saved successfully");
      if (!result.error && form instanceof HTMLFormElement) form.reset();
    });
  };
  return <div className={styles.management}>
    <section className={styles.panel}>
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>Accounts</p><h2>Create account</h2></div></div>
      <form className={styles.createUserForm} onSubmit={event => { event.preventDefault(); submit(createAdminUserAction, event.currentTarget); }}>
        <input name="name" placeholder="Full name" required maxLength={80} />
        <input name="email" type="email" placeholder="Email address" required />
        <input name="password" type="password" placeholder="Password (8+ characters)" required minLength={8} />
        <label><input name="isAdmin" type="checkbox" /> Administrator access</label>
        <button className={styles.primary} disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
      </form>
      {message && <p className={styles.formMessage}>{message}</p>}
    </section>
    <section className={styles.panel}>
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>Accounts</p><h2>Edit and delete</h2></div><span>{users.length}</span></div>
      <div className={styles.table}>{users.map(user => <UserRow key={user.id} user={user} pending={pending} submit={submit} />)}</div>
    </section>
    <section className={styles.brandEditor}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>White label</p><h2>Edit brand</h2><small>Changes save immediately and apply across the app.</small></div></div><form className={styles.brandForm} onSubmit={event => { event.preventDefault(); submit(updateAdminBrandAction, event.currentTarget); }}><input name="name" defaultValue={brand.name} placeholder="Product name" required /><input name="tagline" defaultValue={brand.tagline} placeholder="Tagline" required /><textarea name="description" defaultValue={brand.description} placeholder="Description" required /><input name="logo" defaultValue={brand.logo} placeholder="Logo path or URL" required /><label>Accent color <input name="accent" type="color" defaultValue={brand.accent} /></label><button className={styles.primary} disabled={pending}>{pending ? "Saving…" : "Save brand"}</button></form></section>
    <section className={styles.permissionsPanel}>
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>Access control</p><h2>Board permissions</h2><small>Choose exactly what each member can do on each board.</small></div></div>
      {boards.map(board => <div className={styles.boardPermissions} key={board.id}><h3>{board.name}</h3><div className={styles.permissionTable}>{(members[board.id] ?? []).map(member => <PermissionRow key={member.id} boardId={board.id} member={member} pending={pending} submit={submit} />)}</div></div>)}
    </section>
  </div>;
}

function UserRow({ user, pending, submit }: { user: User; pending: boolean; submit: (action: Action, form: HTMLFormElement | FormData) => void }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <div className={styles.row}><form className={styles.inlineEdit} onSubmit={event => { event.preventDefault(); submit(updateAdminUserAction, event.currentTarget); setEditing(false); }}>
    <input type="hidden" name="userId" value={user.id} /><input name="name" defaultValue={user.name} required /><input name="email" type="email" defaultValue={user.email ?? ""} required /><label><input name="isAdmin" type="checkbox" defaultChecked={Boolean(user.is_admin)} /> Admin</label><button className={styles.saveSmall} disabled={pending}>Save</button>
  </form></div>;
  return <div className={styles.row}><div className={styles.avatar}>{user.name.slice(0, 1).toUpperCase()}</div><div className={styles.identity}><strong>{user.name}</strong><small>{user.email ?? "Guest account"}</small></div><span className={user.is_admin ? styles.accountStatus : styles.guestStatus}>{user.is_admin ? "Admin" : user.email ? "Account" : "Guest"}</span><button className={styles.tableButton} onClick={() => setEditing(true)}>Edit</button><button className={styles.dangerButton} disabled={Boolean(user.is_admin) || pending} onClick={() => { const form = new FormData(); form.set("userId", String(user.id)); submit(deleteAdminUserAction, form); }}>Delete</button></div>;
}

function PermissionRow({ boardId, member, pending, submit }: { boardId: number; member: Member; pending: boolean; submit: (action: Action, form: HTMLFormElement | FormData) => void }) {
  const owner = member.role === "owner";
  return <form onSubmit={event => { event.preventDefault(); submit(updateAdminMemberPermissionsAction, event.currentTarget); }}>
    <input type="hidden" name="boardId" value={boardId} /><input type="hidden" name="userId" value={member.id} /><strong>{member.name}</strong><span className={styles.roleBadge}>{member.role}</span><select name="role" defaultValue={member.role} disabled={owner} aria-label={`Role for ${member.name}`}><option value="editor">Editor</option><option value="commenter">Commenter</option><option value="viewer">Viewer</option></select>
    <label><input name="can_view" type="checkbox" defaultChecked={Boolean(member.can_view)} disabled={owner} /> View</label>
    <label><input name="can_comment" type="checkbox" defaultChecked={Boolean(member.can_comment)} disabled={owner} /> Comment</label>
    <label><input name="can_interact" type="checkbox" defaultChecked={Boolean(member.can_interact)} disabled={owner} /> Interact</label>
    <label><input name="can_manage" type="checkbox" defaultChecked={Boolean(member.can_manage)} disabled={owner} /> Manage</label>
    <button className={styles.saveSmall} disabled={pending || owner}>Save</button>
  </form>;
}
