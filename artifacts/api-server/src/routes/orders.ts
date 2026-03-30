import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { CreateOrderBody, TrackOrderQueryParams } from "@workspace/api-zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
const paymentDir = path.join(uploadsDir, "payment-screenshots");
fs.mkdirSync(paymentDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: paymentDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

router.post("/upload/payment", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const url = `/api/uploads/payment-screenshots/${req.file.filename}`;
  res.json({ url });
});

router.get("/uploads/payment-screenshots/:filename", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const filePath = path.join(paymentDir, raw);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filePath);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data as any;
  const session = (req as any).session;

  const { db: dbClient, siteSettingsTable } = await import("@workspace/db");
  const settings = await dbClient.select().from(siteSettingsTable);
  const settingsMap: Record<string, string> = {};
  settings.forEach((s: any) => { settingsMap[s.key] = s.value; });

  const deliveryFee = parseFloat(settingsMap.delivery_fee || "200");
  const codFeePercent = parseFloat(settingsMap.cod_fee_percent || "10");
  const subtotal = data.items.reduce((s: number, i: any) => s + (i.totalPrice || i.unitPrice * i.quantity), 0);
  const codFee = data.paymentMethod === "cod" ? Math.round(subtotal * codFeePercent / 100) : 0;
  const total = subtotal + deliveryFee + codFee;

  const orderNumber = `ALM-${Date.now().toString(36).toUpperCase()}`;

  const [order] = await db.insert(ordersTable).values({
    orderNumber,
    userId: session?.userId || null,
    customerName: data.customerName,
    customerEmail: data.customerEmail || null,
    customerPhone: data.customerPhone,
    shippingAddress: data.shippingAddress,
    shippingCity: data.shippingCity,
    paymentMethod: data.paymentMethod,
    paymentScreenshotUrl: data.paymentScreenshotUrl || null,
    paymentStatus: "pending",
    status: "pending",
    subtotal: subtotal.toString(),
    deliveryFee: deliveryFee.toString(),
    codFee: codFee.toString(),
    total: total.toString(),
    notes: data.notes || null,
    items: data.items,
  }).returning();

  res.status(201).json(mapOrder(order));
});

router.get("/orders/track", async (req, res): Promise<void> => {
  const query = TrackOrderQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Provide orderNumber or phone" });
    return;
  }
  const { orderNumber, phone } = query.data as any;
  if (!orderNumber && !phone) {
    res.status(400).json({ error: "Provide orderNumber or phone" });
    return;
  }

  const conditions = [];
  if (orderNumber) conditions.push(eq(ordersTable.orderNumber, orderNumber));
  if (phone) conditions.push(eq(ordersTable.customerPhone, phone));

  const orders = await db.select().from(ordersTable).where(or(...conditions));
  const order = orders[0];
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(mapOrder(order));
});

export default router;
