import { pgTable, text, uuid, timestamp, numeric, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentScreenshotUrl: text("payment_screenshot_url"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  status: text("status").notNull().default("pending"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  codFee: numeric("cod_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  items: jsonb("items").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
