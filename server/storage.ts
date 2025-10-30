import { type User, type InsertUser, type CashRegister, type InsertCashRegister, users, cashRegisters } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCashRegisterByDate(date: string): Promise<CashRegister | undefined>;
  saveCashRegister(data: InsertCashRegister): Promise<CashRegister>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cashRegisters: Map<string, CashRegister>;

  constructor() {
    this.users = new Map();
    this.cashRegisters = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCashRegisterByDate(date: string): Promise<CashRegister | undefined> {
    return Array.from(this.cashRegisters.values()).find(
      (register) => register.date === date,
    );
  }

  async saveCashRegister(data: InsertCashRegister): Promise<CashRegister> {
    const existing = await this.getCashRegisterByDate(data.date);
    
    if (existing) {
      const updated: CashRegister = {
        ...existing,
        ...data,
        soldeDepart: data.soldeDepart ?? 0,
      };
      this.cashRegisters.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newRegister: CashRegister = {
        id,
        ...data,
        soldeDepart: data.soldeDepart ?? 0,
        createdAt: new Date(),
      };
      this.cashRegisters.set(id, newRegister);
      return newRegister;
    }
  }
}

export class DbStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getCashRegisterByDate(date: string): Promise<CashRegister | undefined> {
    const result = await this.db.select().from(cashRegisters).where(eq(cashRegisters.date, date));
    return result[0];
  }

  async saveCashRegister(data: InsertCashRegister): Promise<CashRegister> {
    const existing = await this.getCashRegisterByDate(data.date);
    
    if (existing) {
      const result = await this.db
        .update(cashRegisters)
        .set({
          billsData: data.billsData,
          coinsData: data.coinsData,
          operationsData: data.operationsData,
          transactionsData: data.transactionsData,
          soldeDepart: data.soldeDepart ?? 0,
        })
        .where(eq(cashRegisters.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await this.db.insert(cashRegisters).values(data).returning();
      return result[0];
    }
  }
}

export const storage = new DbStorage();
