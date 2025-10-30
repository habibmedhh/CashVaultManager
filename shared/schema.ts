import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const cashRegisters = pgTable("cash_registers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  billsData: text("bills_data").notNull(),
  coinsData: text("coins_data").notNull(),
  operationsData: text("operations_data").notNull(),
  transactionsData: text("transactions_data").notNull(),
  soldeDepart: real("solde_depart").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCashRegisterSchema = createInsertSchema(cashRegisters).omit({
  id: true,
  createdAt: true,
});

export type InsertCashRegister = z.infer<typeof insertCashRegisterSchema>;
export type CashRegister = typeof cashRegisters.$inferSelect;
