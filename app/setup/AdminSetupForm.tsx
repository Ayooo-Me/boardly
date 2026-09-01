"use client";

import { useState, useTransition } from "react";
import { createFirstAdminAction } from "./actions";
import styles from "../admin/admin.module.css";

export default function AdminSetupForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return <form action={formData => { setError(""); startTransition(async () => { const result = await createFirstAdminAction(formData); if (result?.error) setError(result.error); }); }} className={styles.setupForm}>
    <input name="name" placeholder="Your name" required maxLength={80} autoComplete="name" />
    <input name="email" type="email" placeholder="Admin email" required autoComplete="email" />
    <input name="password" type="password" placeholder="Password (8+ characters)" required minLength={8} autoComplete="new-password" />
    <button className={styles.primary} type="submit" disabled={pending}>{pending ? "Creating administrator…" : "Create administrator"}</button>
    {error && <p className={styles.error} role="alert">{error}</p>}
  </form>;
}
