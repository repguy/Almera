import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/session", async (req, res): Promise<void> => {
  const session = (req as any).session;
  if (!session?.userId) {
    res.json({ id: "guest", role: "guest", isLoggedIn: false, email: null, fullName: null });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    session.userId = null;
    res.json({ id: "guest", role: "guest", isLoggedIn: false, email: null, fullName: null });
    return;
  }
  res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, isLoggedIn: true });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, fullName } = parsed.data as { email: string; password: string; fullName?: string };

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    fullName: fullName || null,
    role: "user",
  }).returning();

  (req as any).session.userId = user.id;
  res.status(201).json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, isLoggedIn: true });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  (req as any).session.userId = user.id;
  res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, isLoggedIn: true });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  (req as any).session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
