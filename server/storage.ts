import { type User, type InsertUser, type CashRegister, type InsertCashRegister, users, cashRegisters } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCashRegisterByDate(date: string): Promise<CashRegister | undefined>;
  getLatestCashRegisterByDate(date: string): Promise<CashRegister | undefined>;
  getAllCashRegisters(): Promise<CashRegister[]>;
  getCashRegistersByDateRange(startDate: string, endDate: string): Promise<CashRegister[]>;
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

  async getLatestCashRegisterByDate(date: string): Promise<CashRegister | undefined> {
    const registers = Array.from(this.cashRegisters.values())
      .filter(register => register.date === date)
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
    return registers[0];
  }

  async getAllCashRegisters(): Promise<CashRegister[]> {
    return Array.from(this.cashRegisters.values())
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }

  async getCashRegistersByDateRange(startDate: string, endDate: string): Promise<CashRegister[]> {
    return Array.from(this.cashRegisters.values())
      .filter(register => register.date >= startDate && register.date <= endDate)
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }

  async saveCashRegister(data: InsertCashRegister): Promise<CashRegister> {
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

  async getLatestCashRegisterByDate(date: string): Promise<CashRegister | undefined> {
    const result = await this.db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.date, date))
      .orderBy(desc(cashRegisters.createdAt))
      .limit(1);
    return result[0];
  }

  async getAllCashRegisters(): Promise<CashRegister[]> {
    const result = await this.db
      .select()
      .from(cashRegisters)
      .orderBy(desc(cashRegisters.createdAt));
    return result;
  }

  async getCashRegistersByDateRange(startDate: string, endDate: string): Promise<CashRegister[]> {
    const result = await this.db
      .select()
      .from(cashRegisters)
      .where(
        and(
          gte(cashRegisters.date, startDate),
          lte(cashRegisters.date, endDate)
        )
      )
      .orderBy(desc(cashRegisters.createdAt));
    return result;
  }

  async saveCashRegister(data: InsertCashRegister): Promise<CashRegister> {
    const result = await this.db.insert(cashRegisters).values(data).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
