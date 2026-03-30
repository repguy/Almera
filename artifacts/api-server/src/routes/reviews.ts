import { Router, type IRouter } from "express";
import { db, reviewsTable, productsTable } from "@workspace/db";
import { eq, desc, avg, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/products/:slug/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [product] = await db.select().from(productsTable).where(eq(productsTable.slug, raw));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const reviews = await db.select().from(reviewsTable)
    .where(eq(reviewsTable.productId, product.id))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews.map(r => ({
    id: r.id,
    productId: r.productId,
    productSlug: raw,
    productName: product.name,
    userId: r.userId,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

router.post("/products/:slug/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [product] = await db.select().from(productsTable).where(eq(productsTable.slug, raw));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const { authorName, rating, title, body } = req.body;
  if (!authorName || rating == null || !body) {
    res.status(400).json({ error: "authorName, rating, and body are required" });
    return;
  }
  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be 1-5" });
    return;
  }

  const userId = (req as any).session?.userId || null;

  const [review] = await db.insert(reviewsTable).values({
    productId: product.id,
    userId,
    authorName,
    rating: parseInt(String(rating), 10),
    title: title || null,
    body,
  }).returning();

  // Recalculate product rating
  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, product.id));
  const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

  await db.update(productsTable).set({
    rating: String(avgRating.toFixed(1)),
    reviewCount: allReviews.length,
  }).where(eq(productsTable.id, product.id));

  res.status(201).json({
    id: review.id,
    productId: review.productId,
    productSlug: raw,
    productName: product.name,
    userId: review.userId,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt,
  });
});

export default router;
