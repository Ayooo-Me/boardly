import Image from "next/image";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { countAdmins, countBoardTasks, listAllBoards, listAllUsers, listBoardMembers } from "@/lib/db";
import { brand } from "@/lib/brand";
import { signOutAction } from "@/app/auth/actions";
import ThemeToggle from "@/app/components/ThemeToggle";
import styles from "./admin.module.css";
import AdminManagement from "./AdminManagement";
import BoardManagement from "./BoardManagement";

function AccessDenied({ hasAdmin }: { hasAdmin: boolean }) {
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}><Image src={brand.logo} alt={brand.name} width={38} height={38} priority /><span>{brand.name}</span></Link><div className={styles.actions}><Link href="/" className={styles.back}>Back to app</Link><ThemeToggle /></div></header>
    <section className={styles.denied}><span className={styles.deniedIcon}>!</span><p className={styles.eyebrow}>Admin area</p><h1>{hasAdmin ? "Admin access required" : "Start the installation"}</h1><p>{hasAdmin ? "Sign in with your administrator account to open this dashboard." : "No administrator exists yet. Create the first administrator account to finish setup."}</p><div className={styles.deniedActions}>{hasAdmin ? <Link href="/auth?next=/admin" className={styles.primary}>Sign in</Link> : <Link href="/setup" className={styles.primary}>Start setup</Link>}<Link href="/" className={styles.back}>Return home</Link></div></section>
  </main>;
}

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) return <AccessDenied hasAdmin={countAdmins() > 0} />;

  const users = listAllUsers();
  const boards = listAllBoards();
  const memberCount = boards.reduce((total, board) => total + listBoardMembers(board.id).length, 0);
  const taskCount = boards.reduce((total, board) => total + countBoardTasks(board.id), 0);

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><Image src={brand.logo} alt={brand.name} width={38} height={38} priority /><span>{brand.name}</span></Link>
      <div className={styles.actions}><Link href="/" className={styles.back}>Back to app</Link><form action={signOutAction}><button className={styles.back} type="submit">Sign out</button></form><ThemeToggle /></div>
    </header>
    <div className={styles.content}>
      <div className={styles.heading}><div><p className={styles.eyebrow}>Administrator</p><h1>Workspace control center</h1><p>Manage the health and content of your {brand.name} installation.</p></div><span className={styles.adminBadge}>Signed in as {admin.email}</span></div>
      <section className={styles.stats} aria-label="Workspace statistics"><div><span>Users</span><strong>{users.length}</strong><small>All local accounts</small></div><div><span>Boards</span><strong>{boards.length}</strong><small>Shared workspaces</small></div><div><span>Members</span><strong>{memberCount}</strong><small>Total memberships</small></div><div><span>Tasks</span><strong>{taskCount}</strong><small>Across all boards</small></div></section>
      <div className={styles.grid}>
        <section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>People</p><h2>Accounts</h2></div><span>{users.length}</span></div><div className={styles.table}>{users.map(user => <div className={styles.row} key={user.id}><div className={styles.avatar}>{user.name.slice(0, 1).toUpperCase()}</div><div className={styles.identity}><strong>{user.name}</strong><small>{user.email ?? "Guest account"}</small></div><span className={user.email ? styles.accountStatus : styles.guestStatus}>{user.email ? "Account" : "Guest"}</span></div>)}</div></section>
        <section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>Workspaces</p><h2>Boards</h2></div><span>{boards.length}</span></div><div className={styles.table}>{boards.map(board => <Link href={`/boards/${board.slug}`} className={styles.row} key={board.id}><div className={styles.boardIcon}>▦</div><div className={styles.identity}><strong>{board.name}</strong><small>/{board.slug} · {listBoardMembers(board.id).length} members</small></div><span className={styles.open}>Open →</span></Link>)}</div></section>
      </div>
      <AdminManagement users={users} boards={boards} members={Object.fromEntries(boards.map(board => [board.id, listBoardMembers(board.id)]))} brand={brand} />
      <BoardManagement boards={boards} />
      <section className={styles.brandPanel}><div><p className={styles.eyebrow}>White label</p><h2>Current brand configuration</h2><p>Branding is configured through environment variables and takes effect after a restart or rebuild.</p></div><dl><div><dt>Name</dt><dd>{brand.name}</dd></div><div><dt>Tagline</dt><dd>{brand.tagline}</dd></div><div><dt>Logo</dt><dd>{brand.logo}</dd></div></dl></section>
      <p className={styles.security}>Admin access is controlled by the administrator account stored in the local database. Keep this dashboard behind HTTPS and never expose your production database publicly.</p>
    </div>
  </main>;
}
