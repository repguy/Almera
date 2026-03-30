import { Router, type IRouter } from "express";
import { db, usersTable, addressesTable, ordersTable, reviewsTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

async function requireAuth(req: any, res: any): Promise<string | null> {
  const session = req.session;
  if (!session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return session.userId as string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get("/account/me", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: null,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  });
});

router.put("/account/me", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { fullName, currentPassword, newPassword } = req.body;
  const updates: Record<string, any> = {};

  if (fullName !== undefined) updates.fullName = fullName;

  if (newPassword) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    updates.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    res.json({ id: user!.id, email: user!.email, fullName: user!.fullName, phone: null, createdAt: (user!.createdAt instanceof Date ? user!.createdAt.toISOString() : user!.createdAt) });
    return;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  res.json({
    id: updated.id,
    email: updated.email,
    fullName: updated.fullName,
    phone: null,
    createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
  });
});

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get("/account/orders", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  res.json(orders.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    shippingAddress: o.shippingAddress,
    shippingCity: o.shippingCity,
    paymentMethod: o.paymentMethod,
    paymentScreenshotUrl: o.paymentScreenshotUrl,
    paymentStatus: o.paymentStatus,
    status: o.status,
    subtotal: parseFloat(o.subtotal as string),
    deliveryFee: parseFloat(o.deliveryFee as string),
    codFee: parseFloat(o.codFee as string),
    total: parseFloat(o.total as string),
    notes: o.notes,
    items: o.items || [],
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
  })));
});

// ─── Addresses ────────────────────────────────────────────────────────────────
router.get("/account/addresses", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const addresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, userId));
  res.json(addresses.map(a => ({
    id: a.id,
    label: a.label,
    recipientName: a.recipientName,
    phone: a.phone,
    address: a.address,
    city: a.city,
    isDefault: a.isDefault,
  })));
});

router.post("/account/addresses", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { label, recipientName, phone, address, city, isDefault } = req.body;
  if (!recipientName || !phone || !address || !city) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await db.update(addressesTable).set({ isDefault: false }).where(eq(addressesTable.userId, userId));
  }

  const [addr] = await db.insert(addressesTable).values({
    userId,
    label: label || "Home",
    recipientName,
    phone,
    address,
    city,
    isDefault: isDefault ?? false,
  }).returning();

  res.status(201).json({
    id: addr.id,
    label: addr.label,
    recipientName: addr.recipientName,
    phone: addr.phone,
    address: addr.address,
    city: addr.city,
    isDefault: addr.isDefault,
  });
});

router.put("/account/addresses/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { label, recipientName, phone, address, city, isDefault } = req.body;

  if (isDefault) {
    await db.update(addressesTable).set({ isDefault: false }).where(eq(addressesTable.userId, userId));
  }

  const [addr] = await db.update(addressesTable).set({
    label: label || "Home",
    recipientName,
    phone,
    address,
    city,
    isDefault: isDefault ?? false,
  }).where(eq(addressesTable.id, raw)).returning();

  if (!addr) { res.status(404).json({ error: "Address not found" }); return; }

  res.json({ id: addr.id, label: addr.label, recipientName: addr.recipientName, phone: addr.phone, address: addr.address, city: addr.city, isDefault: addr.isDefault });
});

router.delete("/account/addresses/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(addressesTable).where(eq(addressesTable.id, raw));
  res.status(204).end();
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
router.get("/account/reviews", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const reviews = await db.select().from(reviewsTable)
    .where(eq(reviewsTable.userId, userId))
    .orderBy(desc(reviewsTable.createdAt));

  const products = await db.select({ id: productsTable.id, slug: productsTable.slug, name: productsTable.name }).from(productsTable);
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  res.json(reviews.map(r => ({
    id: r.id,
    productId: r.productId,
    productSlug: productMap[r.productId]?.slug || "",
    productName: productMap[r.productId]?.name || "",
    userId: r.userId,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

export default router;
