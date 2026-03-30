import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const addressesTable = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Home"),
  recipientName: text("recipient_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAddressSchema = createInsertSchema(addressesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addressesTable.$inferSelect;
