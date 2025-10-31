import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agencies = pgTable("agencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
});

export const insertAgencySchema = createInsertSchema(agencies).omit({
  id: true,
});

export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type Agency = typeof agencies.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("agent"),
  agencyId: varchar("agency_id").references(() => agencies.id),
  fullName: text("full_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  agencyId: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const cashRegisters = pgTable("cash_registers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  agencyId: varchar("agency_id").references(() => agencies.id),
  date: text("date").notNull(),
  billsData: text("bills_data").notNull(),
  coinsData: text("coins_data").notNull(),
  operationsData: text("operations_data").notNull(),
  transactionsData: text("transactions_data").notNull(),
  soldeDepart: real("solde_depart").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  dateIdx: index("date_idx").on(table.date),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  userIdIdx: index("user_id_idx").on(table.userId),
  agencyIdIdx: index("agency_id_idx").on(table.agencyId),
}));

export const insertCashRegisterSchema = createInsertSchema(cashRegisters).omit({
  id: true,
  createdAt: true,
});

export type InsertCashRegister = z.infer<typeof insertCashRegisterSchema>;
export type CashRegister = typeof cashRegisters.$inferSelect;

export const pvConfigurations = pgTable("pv_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationsInData: text("operations_in_data").notNull(),
  operationsOutData: text("operations_out_data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPVConfigurationSchema = createInsertSchema(pvConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPVConfiguration = z.infer<typeof insertPVConfigurationSchema>;
export type PVConfiguration = typeof pvConfigurations.$inferSelect;
