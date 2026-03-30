import { pgTable, text, uuid, timestamp, numeric, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: numeric("discounted_price", { precision: 10, scale: 2 }).notNull(),
  images: text("images").array().notNull().default([]),
  videos: text("videos").array().notNull().default([]),
  variants: jsonb("variants").notNull().default([]),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
