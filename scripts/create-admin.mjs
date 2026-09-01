#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createAccount, getDb, getUserByEmail, hashPassword, setUserAdmin } from "../lib/db.ts";

const rl = readline.createInterface({ input, output });
try {
  const name = (await rl.question("Admin name: ")).trim();
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  const password = await rl.question("Admin password (input is visible locally): ");
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) throw new Error("Enter a valid name, email, and password of at least 8 characters.");
  let user = getUserByEmail(email);
  if (user) getDb().prepare("UPDATE users SET name = ?, password_hash = ? WHERE id = ?").run(name, hashPassword(password), user.id);
  else user = createAccount(name, email, password);
  setUserAdmin(user.id, true);
  console.log(`\nAdmin account ready for ${email}. Restart the server and open /admin.`);
} finally {
  rl.close();
  try { getDb().close(); } catch {}
}
