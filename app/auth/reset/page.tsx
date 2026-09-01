import Link from "next/link";
import ResetForm from "../ResetForm";
import styles from "../auth.module.css";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className={styles.page}><section className={styles.card}><p className={styles.eyebrow}>Account recovery</p><h1>Reset password</h1><p className={styles.muted}>Choose a new password using your reset link.</p><ResetForm token={token ?? ""} /><Link className={styles.backLink} href="/auth">Back to sign in</Link></section></main>;
}
