import Image from "next/image";
import Link from "next/link";
import styles from "./docs.module.css";
import ThemeToggle from "../components/ThemeToggle";
import { brand } from "@/lib/brand";

const sections = [
  { id: "start", title: "Getting started" },
  { id: "boards", title: "Board types" },
  { id: "tasks", title: "Tasks and stages" },
  { id: "notes", title: "Shared notes" },
  { id: "access", title: "Access and invites" },
  { id: "collaboration", title: "Collaboration" },
  { id: "admin", title: "Administration" },
  { id: "accounts", title: "Accounts & security" },
  { id: "theme", title: "Theme preferences" },
  { id: "tips", title: "Helpful tips" },
];

const modes = [
  ["Kanban", "Workflow columns for moving tasks from To Do to Done."],
  ["List", "A compact task list for scanning and sorting work."],
  ["Calendar", "A date-focused view for deadlines, publishing, and events."],
  ["Timeline", "Schedule-oriented planning for milestones and delivery windows."],
  ["Table", "Structured rows for CRM, inventory, and database-style tracking."],
  ["Whiteboard", "Flexible, freeform space for ideas and visual planning."],
  ["Forms / Inbox", "Collect incoming requests and turn submissions into work."],
  ["Goals / OKR", "Track objectives, key results, owners, and progress."],
  ["Approval", "Move work through draft, review, changes requested, and approved."],
  ["Support", "Organize tickets, requesters, urgency, and resolution status."],
  ["CRM pipeline", "Manage leads, opportunities, stages, and next actions."],
];

export default function DocsPage() {
  return <div className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}><Image src={brand.logo} alt={brand.name} width={38} height={38} priority /><span>{brand.name}</span></Link><div className={styles.headerActions}><ThemeToggle /><Link href="/" className={styles.back}>Back to app</Link></div></header>
    <main className={styles.layout}>
      <aside className={styles.sidebar}><p className={styles.eyebrow}>Documentation</p><h1>Work together, clearly.</h1><p className={styles.intro}>Everything you need to organize tasks, choose the right board, and keep shared decisions in one place.</p><nav>{sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav></aside>
      <article className={styles.content}>
        <section className={styles.hero}><span className={styles.heroIcon}>✦</span><div><p className={styles.eyebrow}>{brand.name} guide</p><h2>A flexible workspace for shared work</h2><p>Create a board, choose how it should behave, invite the right people, and move work forward without losing the context behind it.</p></div></section>

        <section id="start"><h2>Getting started</h2><p>On a fresh installation, open the site root. You will be sent to <strong>/setup</strong> to create the first administrator account. Once setup is complete, the root opens the normal workspace and <strong>/setup</strong> reports that the installation is already configured.</p><div className={styles.steps}><div><b>01</b><strong>Create</strong><span>Name a board and choose its mode, purpose, and visibility.</span></div><div><b>02</b><strong>Configure</strong><span>Set permissions, board settings, and optional invite rules.</span></div><div><b>03</b><strong>Collaborate</strong><span>Add tasks, assign owners, and capture decisions together.</span></div></div><div className={styles.callout}><strong>Existing installations</strong><span>Sign in at <strong>/auth</strong>, then open <strong>/admin</strong> to manage accounts, boards, branding, permissions, and access codes.</span></div></section>

        <section id="boards"><h2>Board types and purposes</h2><p>A board has two independent settings: its <strong>mode</strong> controls the working layout, while its <strong>purpose</strong> describes the kind of work it contains. This means a content calendar can use Calendar mode, a CRM can use Table mode, and a bug tracker can use Kanban mode.</p><div className={styles.modeGrid}>{modes.map(([name, description]) => <div className={styles.modeCard} key={name}><strong>{name}</strong><span>{description}</span></div>)}</div><p className={styles.note}>Available purpose labels include General, Project, Bug tracker, Content, Support, CRM, Roadmap, Personal, and Goals. Existing boards remain compatible and default to Kanban / General.</p></section>

        <section id="tasks"><h2>Tasks and stages</h2><p>Tasks move through three simple stages: <strong>To Do</strong>, <strong>In Progress</strong>, and <strong>Done</strong>. Use the stage buttons on each card for precise changes, or drag a card into another column.</p><ul><li>Click a task title or <strong>Details</strong> to edit its title and description.</li><li>Use the priority control to choose Low, Medium, or High.</li><li>Add a due date, assignee, recurrence, and labels.</li><li>Use search and filters to focus on the work that matters now.</li><li>Deleted tasks can be restored with the Undo action.</li></ul><p className={styles.note}>Changes are saved on the server, so refreshing the page does not lose your board.</p></section>

        <section id="notes"><h2>Shared notes</h2><p>Board notes work like a lightweight shared document for meeting notes, decisions, links, and planning context. Select text and use the toolbar for headings, emphasis, lists, and links.</p><div className={styles.keyList}><span><kbd>Ctrl/Cmd</kbd> + <kbd>B</kbd><small>Bold text</small></span><span><kbd>Ctrl/Cmd</kbd> + <kbd>I</kbd><small>Italic text</small></span><span><kbd>Ctrl/Cmd</kbd> + <kbd>S</kbd><small>Save notes</small></span></div><p>Notes autosave when you pause typing and when you leave the editor. The saved content is shared with everyone who opens the board.</p></section>

        <section id="access"><h2>Access, visibility, and one-time invites</h2><p>Public boards can be opened from their shared link. Private boards require a one-time access code generated by an administrator. The code can grant a specific role and exact permissions.</p><ul><li>Choose <strong>Public link</strong> or <strong>Private · code required</strong> in board settings.</li><li>Generate an invite code from the admin board panel.</li><li>Choose the recipient role: Editor, Commenter, or Viewer.</li><li>Set View, Comment, Interact, and Manage permissions for that code.</li><li>Codes expire after 24 hours and are invalid immediately after one successful redemption.</li><li>Codes are stored as hashes; the displayed code should be shared securely and cannot be recovered later.</li></ul><div className={styles.callout}><strong>Permission meanings</strong><span><strong>View</strong> opens board content. <strong>Comment</strong> adds discussion. <strong>Interact</strong> changes tasks, stages, labels, and assignments. <strong>Manage</strong> manages members and board settings.</span></div></section>

        <section id="collaboration"><h2>Collaboration</h2><p>{brand.name} refreshes board data periodically so teammates can see new tasks, comments, stage changes, and activity. The activity panel provides a chronological record of important board changes.</p><ul><li>Use <strong>Share link</strong> to copy the current board URL.</li><li>Open the same board in another browser window to test collaboration.</li><li>Comments stay attached to their task for focused discussion.</li><li>Use the Members panel to review roles.</li><li>Server-side permission checks protect every mutation, even if a button is hidden.</li></ul></section>

        <section id="admin"><h2>Administration and white-label settings</h2><p>The first account created at <strong>/setup</strong> becomes the global administrator. Only administrators can create boards. Open <strong>/admin</strong> after signing in to manage the installation.</p><ul><li>Create, edit, promote, demote, and delete accounts.</li><li>Create boards and change their mode, purpose, and public/private visibility.</li><li>Configure board members and their View, Comment, Interact, and Manage permissions.</li><li>Generate secure, expiring, one-time board invite codes.</li><li>Edit product name, tagline, description, logo, and accent color.</li></ul><p>Environment variables remain fallback branding values for fresh installations. Saved admin branding takes precedence and applies without a restart.</p></section>

        <section id="accounts"><h2>Accounts and security</h2><p>{brand.name} supports local email and password accounts. Passwords are stored as strong cryptographic hashes, and authenticated sessions use random, expiring, httpOnly cookies.</p><ul><li>Use <strong>/auth</strong> to sign in or create an account.</li><li>Email verification and password reset links are short-lived, one-time tokens.</li><li>In development, those links are printed in the server console because no email provider is configured.</li><li>Never commit session secrets, passwords, invite codes, or generated tokens.</li><li>Use HTTPS and a reverse proxy before exposing an installation publicly.</li></ul></section>

        <section id="theme"><h2>Theme preferences</h2><p>Use the moon or sun button on every major page to switch themes. {brand.name} stores your choice in this browser and restores it after a reload or when you return to the app.</p><div className={styles.themeGrid}><div className={styles.lightPreview}><b>Light</b><span>Bright surfaces and soft borders</span></div><div className={styles.darkPreview}><b>Dark</b><span>Comfortable contrast for low light</span></div></div></section>

        <section id="tips"><h2>Helpful tips and troubleshooting</h2><ul><li>Keep task titles short and put context in the description or shared notes.</li><li>Use High priority sparingly for work that truly needs attention first.</li><li>Use labels to group recurring kinds of work such as Bug, Feature, Design, or Urgent.</li><li>If a private board does not open, confirm you are signed in and redeem a current invite code.</li><li>If <strong>/setup</strong> says setup is complete, sign in normally instead of trying to create another administrator.</li><li>For local or LAN testing, use <strong>http://</strong>. Use HTTPS only when TLS is configured by a reverse proxy.</li></ul></section>
        <footer className={styles.footer}>{brand.name} keeps the workflow simple: make work visible, keep context close, and move forward together.</footer>
      </article>
    </main>
  </div>;
}
