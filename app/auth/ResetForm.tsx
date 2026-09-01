"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "./actions";
import styles from "./auth.module.css";

export default function ResetForm({ token }: { token: string }) {
  const [error, setError] = useState(""); const [done, setDone] = useState(false); const [pending, startTransition] = useTransition();
  return done ? <p className={styles.success}>Password reset. You can now sign in.</p> : <form onSubmit={event => { event.preventDefault(); setError(""); const data = new FormData(event.currentTarget); startTransition(async () => { const result = await resetPasswordAction(data); if (result.error) setError(result.error); else setDone(true); }); }} className={styles.form}><input type="hidden" name="token" value={token} /><input name="password" type="password" minLength={8} required placeholder="New password (8+ characters)" autoComplete="new-password" /><button type="submit" disabled={pending}>{pending ? "Resetting…" : "Reset password"}</button>{error && <p className={styles.error} role="alert">{error}</p>}</form>;
}
