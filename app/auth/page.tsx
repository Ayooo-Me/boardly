import Image from "next/image";
import Link from "next/link";
import styles from "./auth.module.css";
import ThemeToggle from "../components/ThemeToggle";
import AuthForm from "./AuthForms";
import { brand } from "@/lib/brand";

export default async function AuthPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const next = (await searchParams)?.next ?? "/";
  return <main className={styles.page}>
    <header className={styles.top}><Link href="/" className={styles.brand}><Image src={brand.logo} alt={brand.name} width={36} height={36} priority /><span>{brand.name}</span></Link><div className={styles.topActions}><Link href="/docs" className={styles.docsLink}>Docs</Link><ThemeToggle /></div></header>
    <div className={styles.shell}>
      <section className={styles.pitch}><div className={styles.pitchBadge}><span>✦</span> Your shared workspace</div><h1>Make progress visible.</h1><p>Bring tasks, notes, and decisions together in a calm workspace built for teams that want to move forward.</p><div className={styles.featureList}><div><span className={styles.featureIcon}>✓</span><span><strong>Keep work organized</strong><small>Move tasks from To Do to Done with clarity.</small></span></div><div><span className={styles.featureIcon}>◈</span><span><strong>Keep context close</strong><small>Share notes and decisions alongside your work.</small></span></div><div><span className={styles.featureIcon}>↗</span><span><strong>Work together</strong><small>Invite collaborators with a simple board link.</small></span></div></div><div className={styles.quote}><span>“</span><p>The simplest way to see what needs attention next.</p></div></section>
      <section className={styles.authPanel}><div className={styles.panelIntro}><p className={styles.eyebrow}>Welcome to Boardly</p><h2>Start where you are.</h2><p>Sign in to continue, or create a free account in a few seconds.</p></div><div className={styles.formSection}><h3>Account access</h3><AuthForm next={next} /></div><p className={styles.privacy}>Passwords are securely hashed and sessions use protected httpOnly cookies.</p></section>
    </div>
    <footer className={styles.footer}><Link href="/">← Back to home</Link><span>{brand.name} · Shared work, made simple</span></footer>
  </main>;
}
