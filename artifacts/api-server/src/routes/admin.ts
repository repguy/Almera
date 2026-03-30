import { Router, type IRouter } from "express";
import { db, ordersTable, siteSettingsTable, legalPagesTable, productsTable, reviewsTable } from "@workspace/db";
import { eq, desc, sum, count, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const session = req.session;
  if (!session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const [user] = await db.select().from((await import("@workspace/db")).usersTable).where(eq((await import("@workspace/db")).usersTable.id, session.userId));
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
  limits: { fileSize: 10 * 1024 * 1024 },
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

  const allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

  const totalOrders = allOrders.length;
  const deliveredOrders = allOrders.filter(o => o.status === "delivered").length;
  const pendingOrders = allOrders.filter(o => o.status === "pending").length;
  const processingOrders = allOrders.filter(o => o.status === "processing").length;
  const cancelledOrders = allOrders.filter(o => o.status === "cancelled").length;

  const totalRevenue = allOrders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + parseFloat(o.total as string), 0);

  // Profit = revenue - (delivery fees + cod fees)
  const totalProfit = allOrders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + parseFloat(o.subtotal as string) * 0.3, 0); // estimate 30% margin

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = allOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo && o.status !== "cancelled");

  const dayMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dayMap[key] = { revenue: 0, orders: 0 };
  }

  for (const o of recentOrders) {
    const key = new Date(o.createdAt).toISOString().split("T")[0];
    if (dayMap[key]) {
      dayMap[key].revenue += parseFloat(o.total as string);
      dayMap[key].orders += 1;
    }
  }

  const revenueByDay = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

  // Best sellers from order items
  const productSales: Record<string, { productId: string; productName: string; totalSold: number; totalRevenue: number }> = {};
  for (const o of allOrders.filter(o => o.status !== "cancelled")) {
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

  // Status breakdown
  const statusBreakdown = [
    { status: "pending", count: pendingOrders },
    { status: "processing", count: processingOrders },
    { status: "shipped", count: allOrders.filter(o => o.status === "shipped").length },
    { status: "delivered", count: deliveredOrders },
    { status: "cancelled", count: cancelledOrders },
  ];

  // Category breakdown from products ordered
  const categoryMap: Record<string, { revenue: number; orders: number }> = {};
  for (const o of allOrders.filter(o => o.status !== "cancelled")) {
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

router.delete("/admin/reviews/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(reviewsTable).where(eq(reviewsTable.id, raw));
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
