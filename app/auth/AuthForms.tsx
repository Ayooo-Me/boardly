"use client";

import { useState, useTransition } from "react";
import { signInAction, signUpAction } from "./actions";
import styles from "./auth.module.css";
import { brand } from "@/lib/brand-client";

export default function AuthForm({ next = "/" }: { next?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState(""); const [pending, startTransition] = useTransition();
  const signUp = mode === "signup";
  return <>
    <form onSubmit={event => { event.preventDefault(); setError(""); const data = new FormData(event.currentTarget); startTransition(async () => { const result = signUp ? await signUpAction(data) : await signInAction(data); if (result?.error) setError(result.error); }); }} className={styles.form}>
      <input type="hidden" name="next" value={next} />
      {signUp && <input name="name" placeholder="Your name" required maxLength={80} autoComplete="name" />}
      <input name="email" type="email" placeholder="Email address" required autoComplete="email" />
      <input name="password" type="password" placeholder={signUp ? "Password (8+ characters)" : "Password"} required minLength={signUp ? 8 : undefined} autoComplete={signUp ? "new-password" : "current-password"} />
      <button type="submit" disabled={pending}>{pending ? (signUp ? "Creating account…" : "Signing in…") : (signUp ? "Create account" : "Sign in")}</button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </form>
    <p className={styles.switchText}>{signUp ? "Already have an account?" : `New to ${brand.name}?`} <button type="button" className={styles.switchButton} onClick={() => { setMode(signUp ? "signin" : "signup"); setError(""); }}>{signUp ? "Sign in" : "Create an account"}</button></p>
  </>;
}
