import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingSchema = createInsertSchema(siteSettingsTable).omit({ id: true, updatedAt: true });
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type SiteSetting = typeof siteSettingsTable.$inferSelect;

export const legalPagesTable = pgTable("legal_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLegalPageSchema = createInsertSchema(legalPagesTable).omit({ id: true, updatedAt: true });
export type InsertLegalPage = z.infer<typeof insertLegalPageSchema>;
export type LegalPage = typeof legalPagesTable.$inferSelect;
