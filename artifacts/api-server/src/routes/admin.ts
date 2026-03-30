import { Router, type IRouter } from "express";
import { db, ordersTable, siteSettingsTable, legalPagesTable, productsTable, reviewsTable, usersTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const session = req.session;
  if (!session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

function mapOrder(o: any) {
  return {
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
    subtotal: parseFloat(o.subtotal),
    deliveryFee: parseFloat(o.deliveryFee),
    codFee: parseFloat(o.codFee),
    total: parseFloat(o.total),
    notes: o.notes,
    items: o.items || [],
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
  };
}

function mapProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    originalPrice: parseFloat(p.originalPrice),
    discountedPrice: parseFloat(p.discountedPrice),
    images: (p.images || []).map((img: string) => img.startsWith("/") ? img : `/api/products/image/${img}`),
    videos: p.videos || [],
    variants: p.variants || [],
    rating: parseFloat(p.rating),
    reviewCount: p.reviewCount,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
  };
}

// ─── Upload middleware ───────────────────────────────────────────────────────
const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
const productImagesDir = path.join(uploadsDir, "products");
if (!fs.existsSync(productImagesDir)) fs.mkdirSync(productImagesDir, { recursive: true });

const productImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productImagesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});
const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const allOrders = await db.select().from(ordersTable);
  const totalOrders = allOrders.length;
  const revenue = allOrders
    .filter(o => o.status === "delivered")
    .reduce((s, o) => s + parseFloat(o.total as string), 0);
  const pendingOrders = allOrders.filter(o => o.status === "pending").length;
  const deliveredOrders = allOrders.filter(o => o.status === "delivered").length;

  res.json({ totalOrders, revenue, pendingOrders, deliveredOrders });
});

router.get("/admin/stats/extended", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const period = (req.query.period as string) || "30";
  const allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

  // Determine date range for filtering
  let daysBack = 30;
  let filterDate: Date | null = null;

  if (period === "today") {
    filterDate = new Date();
    filterDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 7);
  } else if (period === "90") {
    filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 90);
    daysBack = 90;
  } else if (period === "365") {
    filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 365);
    daysBack = 365;
  } else if (period === "lifetime") {
    filterDate = null;
    daysBack = 0;
  } else {
    // default: 30 days
    filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 30);
    daysBack = 30;
  }

  // Filter orders for the selected period
  const periodOrders = filterDate
    ? allOrders.filter(o => new Date(o.createdAt) >= filterDate!)
    : allOrders;

  const totalOrders = periodOrders.length;
  const deliveredOrders = periodOrders.filter(o => o.status === "delivered").length;
  const pendingOrders = periodOrders.filter(o => o.status === "pending").length;
  const processingOrders = periodOrders.filter(o => o.status === "processing").length;
  const cancelledOrders = periodOrders.filter(o => o.status === "cancelled").length;

  const totalRevenue = periodOrders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + parseFloat(o.total as string), 0);

  const totalProfit = periodOrders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + parseFloat(o.subtotal as string) * 0.3, 0);

  // Build revenue by day
  let numDays = daysBack;
  if (period === "today") numDays = 1;
  else if (period === "week") numDays = 7;
  else if (period === "lifetime") numDays = 60; // show last 60 days for lifetime

  const dayMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dayMap[key] = { revenue: 0, orders: 0 };
  }

  const ordersForChart = period === "lifetime"
    ? allOrders.filter(o => {
        const d = new Date();
        d.setDate(d.getDate() - 60);
        return new Date(o.createdAt) >= d && o.status !== "cancelled";
      })
    : periodOrders.filter(o => o.status !== "cancelled");

  for (const o of ordersForChart) {
    const key = new Date(o.createdAt).toISOString().split("T")[0];
    if (dayMap[key]) {
      dayMap[key].revenue += parseFloat(o.total as string);
      dayMap[key].orders += 1;
    }
  }

  const revenueByDay = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

  // Best sellers from ALL orders (not filtered by period) for context
  const productSales: Record<string, { productId: string; productName: string; totalSold: number; totalRevenue: number }> = {};
  for (const o of periodOrders.filter(o => o.status !== "cancelled")) {
    const items = (o.items as any[]) || [];
    for (const item of items) {
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = { productId: item.productId, productName: item.productName || "Unknown", totalSold: 0, totalRevenue: 0 };
      }
      productSales[key].totalSold += item.quantity || 1;
      productSales[key].totalRevenue += parseFloat(item.totalPrice) || 0;
    }
  }

  const bestSellers = Object.values(productSales)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  const statusBreakdown = [
    { status: "pending", count: pendingOrders },
    { status: "processing", count: processingOrders },
    { status: "shipped", count: periodOrders.filter(o => o.status === "shipped").length },
    { status: "delivered", count: deliveredOrders },
    { status: "cancelled", count: cancelledOrders },
  ];

  const categoryMap: Record<string, { revenue: number; orders: number }> = {};
  for (const o of periodOrders.filter(o => o.status !== "cancelled")) {
    const items = (o.items as any[]) || [];
    for (const item of items) {
      const cat = item.category || "other";
      if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, orders: 0 };
      categoryMap[cat].revenue += parseFloat(item.totalPrice) || 0;
      categoryMap[cat].orders += 1;
    }
  }
  const categoryBreakdown = Object.entries(categoryMap).map(([category, v]) => ({ category, ...v }));

  res.json({
    totalOrders,
    totalRevenue,
    totalProfit,
    pendingOrders,
    processingOrders,
    deliveredOrders,
    cancelledOrders,
    revenueByDay,
    bestSellers,
    statusBreakdown,
    categoryBreakdown,
  });
});

// ─── Orders ──────────────────────────────────────────────────────────────────
router.get("/admin/orders", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const offset = (page - 1) * limit;

  const allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const total = allOrders.length;
  const data = allOrders.slice(offset, offset + limit).map(mapOrder);

  res.json({ data, total, page, limit });
});

router.patch("/admin/orders/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updates: Record<string, any> = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.paymentStatus) updates.paymentStatus = req.body.paymentStatus;

  const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, raw)).returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(mapOrder(order));
});

// ─── Product CRUD ─────────────────────────────────────────────────────────────
router.get("/admin/products", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  res.json(products.map(mapProduct));
});

router.post("/admin/products", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const { name, slug, description, category, originalPrice, discountedPrice, images, videos, variants, isFeatured, isNew } = req.body;

  if (!name || !slug || !description || !category || originalPrice == null || discountedPrice == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    name,
    slug,
    description,
    category,
    originalPrice: String(originalPrice),
    discountedPrice: String(discountedPrice),
    images: images || [],
    videos: videos || [],
    variants: variants || [],
    isFeatured: isFeatured ?? false,
    isNew: isNew ?? false,
  }).returning();

  res.status(201).json(mapProduct(product));
});

router.put("/admin/products/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, slug, description, category, originalPrice, discountedPrice, images, videos, variants, isFeatured, isNew } = req.body;

  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (slug !== undefined) updates.slug = slug;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (originalPrice !== undefined) updates.originalPrice = String(originalPrice);
  if (discountedPrice !== undefined) updates.discountedPrice = String(discountedPrice);
  if (images !== undefined) updates.images = images;
  if (videos !== undefined) updates.videos = videos;
  if (variants !== undefined) updates.variants = variants;
  if (isFeatured !== undefined) updates.isFeatured = isFeatured;
  if (isNew !== undefined) updates.isNew = isNew;

  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, raw)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(mapProduct(product));
});

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(productsTable).where(eq(productsTable.id, raw));
  res.status(204).end();
});

router.post("/admin/upload/product-image",
  uploadProductImage.single("file"),
  async (req: any, res): Promise<void> => {
    if (!await requireAdmin(req, res)) return;
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const url = `/api/products/image/${req.file.filename}`;
    res.json({ url });
  }
);

// ─── Reviews ─────────────────────────────────────────────────────────────────
router.get("/admin/reviews", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const reviews = await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
  const products = await db.select({ id: productsTable.id, slug: productsTable.slug, name: productsTable.name }).from(productsTable);
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  res.json(reviews.map(r => ({
    ...r,
    productSlug: productMap[r.productId]?.slug || "",
    productName: productMap[r.productId]?.name || "",
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

router.post("/admin/reviews", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const { productId, authorName, rating, title, body } = req.body;
  if (!productId || !authorName || rating == null || !body) {
    res.status(400).json({ error: "productId, authorName, rating, and body are required" });
    return;
  }
  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be 1-5" });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    productId,
    userId: null,
    authorName,
    rating: parseInt(String(rating), 10),
    title: title || null,
    body,
  }).returning();

  // Recalculate product rating
  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, productId));
  const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  await db.update(productsTable).set({
    rating: String(avgRating.toFixed(1)),
    reviewCount: allReviews.length,
  }).where(eq(productsTable.id, productId));

  res.status(201).json({
    id: review.id,
    productId: review.productId,
    productSlug: product.slug,
    productName: product.name,
    userId: review.userId,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt,
  });
});

router.delete("/admin/reviews/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  // Get review to find productId for rating recalculation
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, raw));
  if (review) {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, raw));
    // Recalculate rating
    const remaining = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, review.productId));
    const avgRating = remaining.length ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length : 0;
    await db.update(productsTable).set({
      rating: String(avgRating.toFixed(1)),
      reviewCount: remaining.length,
    }).where(eq(productsTable.id, review.productId));
  }

  res.status(204).end();
});

// ─── Users (Account Management) ──────────────────────────────────────────────
router.get("/admin/users", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  const orders = await db.select({ userId: ordersTable.userId }).from(ordersTable);

  const orderCounts: Record<string, number> = {};
  for (const o of orders) {
    if (o.userId) orderCounts[o.userId] = (orderCounts[o.userId] || 0) + 1;
  }

  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    orderCount: orderCounts[u.id] || 0,
  })));
});

router.post("/admin/users", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const { email, password, fullName, role } = req.body;
  if (!email || !password || !role) {
    res.status(400).json({ error: "email, password, and role are required" });
    return;
  }

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
    role,
  }).returning();

  res.status(201).json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    orderCount: 0,
  });
});

router.patch("/admin/users/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { email, fullName, role, password } = req.body;

  const updates: Record<string, any> = {};
  if (email !== undefined) updates.email = email;
  if (fullName !== undefined) updates.fullName = fullName;
  if (role !== undefined) updates.role = role;
  if (password) updates.passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, raw)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const orderRows = await db.select({ userId: ordersTable.userId }).from(ordersTable).where(eq(ordersTable.userId, raw));
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    orderCount: orderRows.length,
  });
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  // Prevent deleting own account
  const session = req.session as any;
  if (session?.userId === raw) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, raw));
  res.status(204).end();
});

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get("/admin/settings", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, string> = {};
  settings.forEach(s => { result[s.key] = s.value; });
  res.json(result);
});

router.put("/admin/settings", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const entries = Object.entries(req.body);
  for (const [key, value] of entries) {
    await db.insert(siteSettingsTable)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: String(value) } });
  }

  res.json({ ok: true });
});

// ─── Legal Pages ──────────────────────────────────────────────────────────────
router.get("/admin/legal", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const pages = await db.select().from(legalPagesTable);
  res.json(pages.map(p => ({ ...p, updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt })));
});

router.put("/admin/legal/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const updates: Record<string, any> = {};
  if (req.body.title) updates.title = req.body.title;
  if (req.body.content !== undefined) updates.content = req.body.content;

  const [page] = await db.update(legalPagesTable).set(updates).where(eq(legalPagesTable.id, raw)).returning();
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json({ ...page, updatedAt: page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt });
});

export default router;
