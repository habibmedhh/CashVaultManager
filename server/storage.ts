import { type User, type InsertUser, type CashRegister, type InsertCashRegister, type Agency, type InsertAgency, type PVConfiguration, type InsertPVConfiguration, users, cashRegisters, agencies, pvConfigurations } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByAgency(agencyId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  getAgency(id: string): Promise<Agency | undefined>;
  getAllAgencies(): Promise<Agency[]>;
  createAgency(agency: InsertAgency): Promise<Agency>;
  
  getCashRegisterByDate(date: string): Promise<CashRegister | undefined>;
  getLatestCashRegisterByDate(date: string): Promise<CashRegister | undefined>;
  getLatestCashRegisterByDateAndUser(date: string, userId: string): Promise<CashRegister | undefined>;
  getAllCashRegisters(): Promise<CashRegister[]>;
  getCashRegistersByUser(userId: string): Promise<CashRegister[]>;
  getCashRegistersByAgency(agencyId: string): Promise<CashRegister[]>;
  getCashRegistersByDateRange(startDate: string, endDate: string): Promise<CashRegister[]>;
  saveCashRegister(data: InsertCashRegister): Promise<CashRegister>;
  
  getPVConfiguration(): Promise<PVConfiguration | undefined>;
  savePVConfiguration(data: InsertPVConfiguration): Promise<PVConfiguration>;
  updatePVConfiguration(id: string, data: InsertPVConfiguration): Promise<PVConfiguration | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private agencies: Map<string, Agency>;
  private cashRegisters: Map<string, CashRegister>;
  private pvConfiguration: PVConfiguration | null;

  constructor() {
    this.users = new Map();
    this.agencies = new Map();
    this.cashRegisters = new Map();
    this.pvConfiguration = null;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByAgency(agencyId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.agencyId === agencyId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || "agent",
      agencyId: insertUser.agencyId || null,
      fullName: insertUser.fullName || null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...data,
      id: user.id,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAgency(id: string): Promise<Agency | undefined> {
    return this.agencies.get(id);
  }

  async getAllAgencies(): Promise<Agency[]> {
    return Array.from(this.agencies.values());
  }

  async createAgency(insertAgency: InsertAgency): Promise<Agency> {
    const id = randomUUID();
    const agency: Agency = { id, ...insertAgency };
    this.agencies.set(id, agency);
    return agency;
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

  async getLatestCashRegisterByDateAndUser(date: string, userId: string): Promise<CashRegister | undefined> {
    const registers = Array.from(this.cashRegisters.values())
      .filter(register => register.date === date && register.userId === userId)
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

  async getCashRegistersByUser(userId: string): Promise<CashRegister[]> {
    return Array.from(this.cashRegisters.values())
      .filter(register => register.userId === userId)
      .sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }

  async getCashRegistersByAgency(agencyId: string): Promise<CashRegister[]> {
    return Array.from(this.cashRegisters.values())
      .filter(register => register.agencyId === agencyId)
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
      userId: data.userId || null,
      agencyId: data.agencyId || null,
      date: data.date,
      billsData: data.billsData,
      coinsData: data.coinsData,
      operationsData: data.operationsData,
      transactionsData: data.transactionsData,
      soldeDepart: data.soldeDepart ?? 0,
      createdAt: new Date(),
    };
    this.cashRegisters.set(id, newRegister);
    return newRegister;
  }

  async getPVConfiguration(): Promise<PVConfiguration | undefined> {
    return this.pvConfiguration || undefined;
  }

  async savePVConfiguration(data: InsertPVConfiguration): Promise<PVConfiguration> {
    const id = randomUUID();
    const config: PVConfiguration = {
      id,
      operationsInData: data.operationsInData,
      operationsOutData: data.operationsOutData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pvConfiguration = config;
    return config;
  }

  async updatePVConfiguration(id: string, data: InsertPVConfiguration): Promise<PVConfiguration | undefined> {
    if (!this.pvConfiguration || this.pvConfiguration.id !== id) {
      return undefined;
    }
    const updated: PVConfiguration = {
      ...this.pvConfiguration,
      operationsInData: data.operationsInData,
      operationsOutData: data.operationsOutData,
      updatedAt: new Date(),
    };
    this.pvConfiguration = updated;
    return updated;
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

  async getAllUsers(): Promise<User[]> {
    const result = await this.db.select().from(users);
    return result;
  }

  async getUsersByAgency(agencyId: string): Promise<User[]> {
    const result = await this.db.select().from(users).where(eq(users.agencyId, agencyId));
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getAgency(id: string): Promise<Agency | undefined> {
    const result = await this.db.select().from(agencies).where(eq(agencies.id, id));
    return result[0];
  }

  async getAllAgencies(): Promise<Agency[]> {
    const result = await this.db.select().from(agencies);
    return result;
  }

  async createAgency(insertAgency: InsertAgency): Promise<Agency> {
    const result = await this.db.insert(agencies).values(insertAgency).returning();
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

  async getLatestCashRegisterByDateAndUser(date: string, userId: string): Promise<CashRegister | undefined> {
    const result = await this.db
      .select()
      .from(cashRegisters)
      .where(and(eq(cashRegisters.date, date), eq(cashRegisters.userId, userId)))
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

  async getCashRegistersByUser(userId: string): Promise<CashRegister[]> {
    const result = await this.db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.userId, userId))
      .orderBy(desc(cashRegisters.createdAt));
    return result;
  }

  async getCashRegistersByAgency(agencyId: string): Promise<CashRegister[]> {
    const result = await this.db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.agencyId, agencyId))
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

  async getPVConfiguration(): Promise<PVConfiguration | undefined> {
    const result = await this.db.select().from(pvConfigurations).limit(1);
    return result[0];
  }

  async savePVConfiguration(data: InsertPVConfiguration): Promise<PVConfiguration> {
    const result = await this.db.insert(pvConfigurations).values(data).returning();
    return result[0];
  }

  async updatePVConfiguration(id: string, data: InsertPVConfiguration): Promise<PVConfiguration | undefined> {
    const result = await this.db
      .update(pvConfigurations)
      .set({
        ...data,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(pvConfigurations.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
