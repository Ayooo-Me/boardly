import Link from "next/link";
import { verifyEmailAction } from "../actions";
import styles from "../auth.module.css";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { error: "Verification token is missing" };
  return <main className={styles.page}><section className={styles.card}><h1>{result.error ? "Verification failed" : "Email verified"}</h1><p className={styles.muted}>{result.error ?? "Your email address is now verified."}</p><Link className={styles.linkButton} href="/">Continue to Boardly</Link></section></main>;
}
