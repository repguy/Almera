import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { ListProductsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

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

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success) {
    if (query.data.category) {
      conditions.push(eq(productsTable.category, query.data.category));
    }
    if (query.data.featured) {
      conditions.push(eq(productsTable.isFeatured, true));
    }
  }
  const products = conditions.length > 0
    ? await db.select().from(productsTable).where(and(...conditions))
    : await db.select().from(productsTable);
  res.json(products.map(mapProduct));
});

router.get("/products/image/:filename", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsDir, "products", raw);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Image not found" });
    return;
  }
  res.sendFile(filePath);
});

router.get("/products/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [product] = await db.select().from(productsTable).where(eq(productsTable.slug, raw));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(mapProduct(product));
});

export default router;
