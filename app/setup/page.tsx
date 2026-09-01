import Image from "next/image";
import Link from "next/link";
import { countAdmins } from "@/lib/db";
import { brand } from "@/lib/brand";
import AdminSetupForm from "./AdminSetupForm";
import ThemeToggle from "@/app/components/ThemeToggle";
import styles from "../admin/admin.module.css";

export default function SetupPage() {
  const configured = countAdmins() > 0;
  return <main className={styles.page}><header className={styles.header}><Link href="/" className={styles.brand}><Image src={brand.logo} alt={brand.name} width={38} height={38} priority /><span>{brand.name}</span></Link><div className={styles.actions}><Link href="/" className={styles.back}>Back to app</Link><ThemeToggle /></div></header><section className={styles.denied}>{configured ? <><p className={styles.eyebrow}>Already configured</p><h1>Admin setup is complete</h1><p>An administrator already exists. Sign in with that account to continue.</p><Link href="/auth?next=/admin" className={styles.primary}>Sign in</Link></> : <><p className={styles.eyebrow}>First-time setup</p><h1>Create your administrator account</h1><p>This secure setup runs once for this installation. Choose the email and password you will use to manage the workspace.</p><AdminSetupForm /><p className={styles.security}>Passwords are securely hashed. Keep your administrator credentials private.</p></>}</section></main>;
}
