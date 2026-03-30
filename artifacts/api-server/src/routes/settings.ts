import { Router, type IRouter } from "express";
import { db, siteSettingsTable, legalPagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, string> = {};
  settings.forEach(s => { result[s.key] = s.value; });
  res.json(result);
});

router.get("/legal/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [page] = await db.select().from(legalPagesTable).where(eq(legalPagesTable.slug, raw));
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json({ ...page, updatedAt: page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt });
});

export default router;
