import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./home.module.css";
import { getUserById, getUserBySession, getBoardById, hasAnyBoards, listTasks, listUserBoards } from "@/lib/db";
import { createBoardAction, joinBoardAction } from "./boards/[slug]/actions";
import { signOutAction } from "./auth/actions";
import ThemeToggle from "./components/ThemeToggle";
import { brand } from "@/lib/brand";
import { isAdmin } from "@/lib/admin";
import { countAdmins } from "@/lib/db";

export default async function HomePage() {
  if (countAdmins() === 0 && !hasAnyBoards()) redirect("/setup");
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("boardly_session")?.value;
  const sessionUser = sessionId ? getUserBySession(sessionId) : null;
  const rawUserId = cookieStore.get("tb_user_id")?.value;
  const parsedUserId = rawUserId ? Number(rawUserId) : NaN;
  const userId = Number.isInteger(parsedUserId) ? parsedUserId : null;
  const currentUser = sessionUser ?? (userId != null ? getUserById(userId) : null);
  const accountBoards = currentUser?.email ? listUserBoards(currentUser.id) : [];
  let myBoard: { slug: string; name: string; taskCount: number } | null = null;
  if (currentUser && accountBoards.length === 0) {
    const board = getBoardById(currentUser.board_id);
    if (board) myBoard = { slug: board.slug, name: board.name, taskCount: listTasks(board.id).length };
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}><div className={styles.headerActions}><Link href="/docs" className={styles.docsLink}>Docs</Link>{countAdmins() === 0 && <Link href="/setup" className={styles.docsLink}>Setup</Link>}{isAdmin(currentUser) && <Link href="/admin" className={styles.docsLink}>Admin</Link>}{(sessionUser || userId != null) ? <form action={signOutAction}><button className={styles.docsLink} type="submit">Sign out</button></form> : <Link href="/auth" className={styles.docsLink}>Sign in</Link>}<ThemeToggle /></div>
        <div className={styles.brandMark}><Image src={brand.logo} alt="" width={56} height={56} priority /></div>
        <div className={styles.titleLine}><h1 className={styles.title}>{brand.name}</h1></div>
        <p className={styles.sub}>{brand.tagline}</p>
      </header>
      <main className={styles.main}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your board</h2>
          {accountBoards.length > 0 ? <div className={styles.boardList}>{accountBoards.map(board => <Link key={board.id} href={`/boards/${board.slug}`} className={styles.boardCard}><span className={styles.boardName}>{board.name}</span><span className={styles.boardMeta}>{listTasks(board.id).length} tasks · Open board →</span></Link>)}</div> : myBoard ? <div className={styles.boardCard}><Link href={`/boards/${myBoard.slug}`} className={styles.boardLink}><span className={styles.boardName}>{myBoard.name}</span><span className={styles.boardMeta}>{myBoard.taskCount} task{myBoard.taskCount === 1 ? "" : "s"}</span></Link><p className={styles.boardHint}>Open your board to continue.</p></div> : <p className={styles.empty}>Create a board or join one from a shared link.</p>}
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Create a board</h2>
          {currentUser?.is_admin ? <form action={async (formData: FormData) => { "use server"; await createBoardAction(formData); }} className={styles.createForm}>
            <input name="name" placeholder="Board name" className={styles.input} required maxLength={80} />
            <button type="submit" className={styles.btn}>Create board</button>
          </form> : <p className={styles.hint}>{currentUser ? "Only administrators can create boards. Ask an administrator to create one for you." : "Sign in as an administrator to create a board."}</p>}
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Join a board</h2>
          <form action={async (formData: FormData) => { "use server"; await joinBoardAction(formData); }} className={styles.joinForm}>
            <input name="slug" placeholder="Paste board link or slug" className={styles.input} required />
            {!currentUser && <p className={styles.hint}>Sign in first to join with your account name.</p>}
            <button type="submit" className={styles.btn}>{currentUser ? "Join board" : "Sign in to join"}</button>
          </form>
          <p className={styles.hint}>You can paste a full link like <code>/boards/team-planning</code> or just its slug.</p>
        </section>
      </main>
      <footer className={styles.footer}>{currentUser ? <span className={styles.demoLink}>Signed in as {currentUser.name}</span> : <Link href="/auth" className={styles.demoLink}>Sign in to create or join a board →</Link>}</footer>
    </div>
  );
}
