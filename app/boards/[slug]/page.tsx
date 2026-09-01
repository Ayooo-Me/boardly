import Image from "next/image";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import BoardClient from "./BoardClient";
import { getBoardBySlug, getBoardDocument, getBoardMember, getUserById, getUserBySession, listActivity, listBoardMembers, listUsers, listTasks, listNotes } from "@/lib/db";
import type { Note } from "@/lib/db";
import styles from "./board.module.css";
import ThemeToggle from "@/app/components/ThemeToggle";
import { brand } from "@/lib/brand";

export default async function BoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const board = getBoardBySlug(slug);
  if (!board) redirect("/");

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("boardly_session")?.value;
  const sessionUser = sessionId ? getUserBySession(sessionId) : null;
  const rawUserId = cookieStore.get("tb_user_id")?.value;
  const userId = rawUserId ? Number(rawUserId) : NaN;
  const foundUser = sessionUser ?? (Number.isInteger(userId) ? getUserById(userId) : null);

  if (!foundUser || !getBoardMember(board.id, foundUser.id)) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const protocol = (requestHeaders.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
    const shareUrl = host ? `${protocol}://${host}/boards/${encodeURIComponent(slug)}` : `/boards/${slug}`;
    return (
      <div className={styles.guestWrap}>
        <div className={styles.guestCard}>
          <div className={styles.guestTop}><Link href="/" className={styles.brand} aria-label="Boardly home"><Image src={brand.logo} alt={brand.name} width={42} height={42} priority /></Link><ThemeToggle /></div>
          <h1 className={styles.guestTitle}>{board.name}</h1>
          <p className={styles.guestText}>Sign in to join this board with your account name.</p>
          <Link href={`/auth?next=${encodeURIComponent(`/boards/${slug}`)}`} className={styles.addBtn}>Sign in to join</Link>
          <p className={styles.shareLabel}>Share this link</p>
          <code className={styles.shareUrl}>{shareUrl}</code>
          <Link href="/" className={styles.backLink}>← Back to {brand.name}</Link>
        </div>
      </div>
    );
  }

  const users = listUsers(board.id);
  const members = listBoardMembers(board.id);
  const role = getBoardMember(board.id, foundUser.id)?.role ?? "viewer";
  const tasks = listTasks(board.id);
  const notes: Record<number, Note[]> = {};
  for (const task of tasks) notes[task.id] = listNotes(task.id);

  const document = getBoardDocument(board.id);
  const activity = listActivity(board.id);
  return <BoardClient mode={board.mode ?? "kanban"} purpose={board.purpose ?? "general"} slug={slug} boardName={board.name} user={{ id: foundUser.id, name: foundUser.name }} role={role} users={users} members={members} tasks={tasks} notes={notes} document={document} activity={activity} />;
}
