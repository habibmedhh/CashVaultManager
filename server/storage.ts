import { type User, type InsertUser, type CashRegister, type InsertCashRegister, type Agency, type InsertAgency, type PVConfiguration, type InsertPVConfiguration, users, cashRegisters, agencies, pvConfigurations } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, and, gte, lte, lt, sql } from "drizzle-orm";

interface Operation {
  type: "IN" | "OUT";
  amount: number;
}

interface Transaction {
  type: "versement" | "retrait";
  amount: number;
}

function calculateSoldeFinal(register: CashRegister): number {
  try {
    const operations = JSON.parse(register.operationsData) as Operation[];
    const transactions = JSON.parse(register.transactionsData) as Transaction[];
    
    const totalOperations = operations.reduce((sum, op) => {
      if (op.type === "OUT") {
        return sum - op.amount;
      }
      return sum + op.amount;
    }, 0);
    
    const totalVersements = transactions
      .filter(t => t.type === "versement")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalRetraits = transactions
      .filter(t => t.type === "retrait")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return register.soldeDepart + totalOperations + totalVersements - totalRetraits;
  } catch (e) {
    return register.soldeDepart;
  }
}

function getPreviousDate(currentDate: string): string {
  const date = new Date(currentDate);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

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
  updateCashRegister(id: string, data: Partial<InsertCashRegister>): Promise<CashRegister | undefined>;
  
  getPVConfiguration(): Promise<PVConfiguration | undefined>;
  savePVConfiguration(data: InsertPVConfiguration): Promise<PVConfiguration>;
  updatePVConfiguration(id: string, data: InsertPVConfiguration): Promise<PVConfiguration | undefined>;
  
  getPreviousDaySoldeFinal(currentDate: string, userId: string): Promise<number>;
  getPreviousDayAgencySoldeFinal(currentDate: string, agencyId: string): Promise<number>;
  migrateAllSoldeDepartAutomatically(): Promise<{ updated: number; total: number }>;
  cleanupDuplicatePVs(): Promise<{ deleted: number; kept: number }>;
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

  async getPreviousDaySoldeFinal(currentDate: string, userId: string): Promise<number> {
    let searchDate = getPreviousDate(currentDate);
    let daysSearched = 0;
    const maxDaysToSearch = 30;
    
    while (daysSearched < maxDaysToSearch) {
      const register = await this.getLatestCashRegisterByDateAndUser(searchDate, userId);
      if (register) {
        return calculateSoldeFinal(register);
      }
      searchDate = getPreviousDate(searchDate);
      daysSearched++;
    }
    
    return 0;
  }

  async getPreviousDayAgencySoldeFinal(currentDate: string, agencyId: string): Promise<number> {
    let searchDate = getPreviousDate(currentDate);
    let daysSearched = 0;
    const maxDaysToSearch = 30;
    
    while (daysSearched < maxDaysToSearch) {
      const registers = Array.from(this.cashRegisters.values())
        .filter(r => r.date === searchDate && r.agencyId === agencyId);
      
      if (registers.length > 0) {
        const userRegisters = new Map<string, CashRegister>();
        registers.forEach(r => {
          if (r.userId) {
            const existing = userRegisters.get(r.userId);
            if (!existing || (r.createdAt && existing.createdAt && r.createdAt > existing.createdAt)) {
              userRegisters.set(r.userId, r);
            }
          }
        });
        
        return Array.from(userRegisters.values()).reduce((sum, r) => sum + calculateSoldeFinal(r), 0);
      }
      
      searchDate = getPreviousDate(searchDate);
      daysSearched++;
    }
    
    return 0;
  }

  async updateCashRegister(id: string, data: Partial<InsertCashRegister>): Promise<CashRegister | undefined> {
    const existing = this.cashRegisters.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: CashRegister = {
      ...existing,
      ...data,
    };
    this.cashRegisters.set(id, updated);
    return updated;
  }

  async migrateAllSoldeDepartAutomatically(): Promise<{ updated: number; total: number }> {
    const allRegisters = await this.getAllCashRegisters();
    let updated = 0;
    
    // Group by user and sort by date
    const registersByUser = new Map<string, CashRegister[]>();
    allRegisters.forEach(r => {
      if (r.userId) {
        if (!registersByUser.has(r.userId)) {
          registersByUser.set(r.userId, []);
        }
        registersByUser.get(r.userId)!.push(r);
      }
    });
    
    // Process each user's registers in chronological order
    Array.from(registersByUser.entries()).forEach(([userId, registers]) => {
      // Sort by date (oldest first), then by createdAt
      registers.sort((a: CashRegister, b: CashRegister) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        // If same date, sort by createdAt (oldest first)
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeA - timeB;
      });
      
      // Skip if no registers
      if (registers.length === 0) return;
      
      // For first register, keep its existing soldeDepart and calculate its soldeFinal
      let previousSoldeFinal = calculateSoldeFinal(registers[0]);
      
      // Process remaining registers (starting from index 1)
      for (let i = 1; i < registers.length; i++) {
        const register = registers[i];
        
        // Update soldeDepart with previous soldeFinal
        if (register.soldeDepart !== previousSoldeFinal) {
          register.soldeDepart = previousSoldeFinal;
          this.cashRegisters.set(register.id, register);
          updated++;
        }
        
        // Calculate this register's soldeFinal for next iteration
        previousSoldeFinal = calculateSoldeFinal(register);
      }
    });
    
    return { updated, total: allRegisters.length };
  }

  async cleanupDuplicatePVs(): Promise<{ deleted: number; kept: number }> {
    const allRegisters = await this.getAllCashRegisters();
    const groupedByUserAndDate = new Map<string, CashRegister[]>();
    
    // Group PVs by userId + date
    allRegisters.forEach(pv => {
      if (pv.userId) {
        const key = `${pv.userId}-${pv.date}`;
        if (!groupedByUserAndDate.has(key)) {
          groupedByUserAndDate.set(key, []);
        }
        groupedByUserAndDate.get(key)!.push(pv);
      }
    });
    
    let deleted = 0;
    let kept = 0;
    
    // For each group, keep only the most recent PV
    groupedByUserAndDate.forEach((pvs, key) => {
      if (pvs.length > 1) {
        // Sort by createdAt (most recent first)
        pvs.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });
        
        // Keep the first one (most recent), delete the rest
        for (let i = 1; i < pvs.length; i++) {
          this.cashRegisters.delete(pvs[i].id);
          deleted++;
        }
        kept++;
      } else {
        kept++;
      }
    });
    
    return { deleted, kept };
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

  async getPreviousDaySoldeFinal(currentDate: string, userId: string): Promise<number> {
    let searchDate = getPreviousDate(currentDate);
    let daysSearched = 0;
    const maxDaysToSearch = 30;
    
    while (daysSearched < maxDaysToSearch) {
      const register = await this.getLatestCashRegisterByDateAndUser(searchDate, userId);
      if (register) {
        return calculateSoldeFinal(register);
      }
      searchDate = getPreviousDate(searchDate);
      daysSearched++;
    }
    
    return 0;
  }

  async getPreviousDayAgencySoldeFinal(currentDate: string, agencyId: string): Promise<number> {
    let searchDate = getPreviousDate(currentDate);
    let daysSearched = 0;
    const maxDaysToSearch = 30;
    
    while (daysSearched < maxDaysToSearch) {
      const registers = await this.db
        .select()
        .from(cashRegisters)
        .where(and(
          eq(cashRegisters.date, searchDate),
          eq(cashRegisters.agencyId, agencyId)
        ))
        .orderBy(desc(cashRegisters.createdAt));
      
      if (registers.length > 0) {
        const userRegisters = new Map<string, CashRegister>();
        registers.forEach(r => {
          if (r.userId) {
            const existing = userRegisters.get(r.userId);
            if (!existing || (r.createdAt && existing.createdAt && r.createdAt > existing.createdAt)) {
              userRegisters.set(r.userId, r);
            }
          }
        });
        
        return Array.from(userRegisters.values()).reduce((sum, r) => sum + calculateSoldeFinal(r), 0);
      }
      
      searchDate = getPreviousDate(searchDate);
      daysSearched++;
    }
    
    return 0;
  }

  async updateCashRegister(id: string, data: Partial<InsertCashRegister>): Promise<CashRegister | undefined> {
    const result = await this.db
      .update(cashRegisters)
      .set(data)
      .where(eq(cashRegisters.id, id))
      .returning();
    return result[0];
  }

  async migrateAllSoldeDepartAutomatically(): Promise<{ updated: number; total: number }> {
    const allRegisters = await this.getAllCashRegisters();
    let updated = 0;
    
    // Group by user and sort by date
    const registersByUser = new Map<string, CashRegister[]>();
    allRegisters.forEach(r => {
      if (r.userId) {
        if (!registersByUser.has(r.userId)) {
          registersByUser.set(r.userId, []);
        }
        registersByUser.get(r.userId)!.push(r);
      }
    });
    
    // Process each user's registers in chronological order
    for (const [userId, registers] of Array.from(registersByUser.entries())) {
      // Sort by date (oldest first), then by createdAt
      registers.sort((a: CashRegister, b: CashRegister) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        // If same date, sort by createdAt (oldest first)
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeA - timeB;
      });
      
      // Skip if no registers
      if (registers.length === 0) continue;
      
      // For first register, keep its existing soldeDepart and calculate its soldeFinal
      let previousSoldeFinal = calculateSoldeFinal(registers[0]);
      
      // Process remaining registers (starting from index 1)
      for (let i = 1; i < registers.length; i++) {
        const register = registers[i];
        
        // Always update soldeDepart with previous soldeFinal (force update to ensure consistency)
        const needsUpdate = register.soldeDepart !== previousSoldeFinal;
        await this.updateCashRegister(register.id, { soldeDepart: previousSoldeFinal });
        register.soldeDepart = previousSoldeFinal; // Update local object too
        if (needsUpdate) {
          updated++;
        }
        
        // Calculate this register's soldeFinal for next iteration
        previousSoldeFinal = calculateSoldeFinal(register);
      }
    }
    
    return { updated, total: allRegisters.length };
  }

  async cleanupDuplicatePVs(): Promise<{ deleted: number; kept: number }> {
    const allRegisters = await this.getAllCashRegisters();
    const groupedByUserAndDate = new Map<string, CashRegister[]>();
    
    // Group PVs by userId + date
    allRegisters.forEach(pv => {
      if (pv.userId) {
        const key = `${pv.userId}-${pv.date}`;
        if (!groupedByUserAndDate.has(key)) {
          groupedByUserAndDate.set(key, []);
        }
        groupedByUserAndDate.get(key)!.push(pv);
      }
    });
    
    let deleted = 0;
    let kept = 0;
    
    // For each group, keep only the most recent PV
    for (const [key, pvs] of Array.from(groupedByUserAndDate.entries())) {
      if (pvs.length > 1) {
        // Sort by createdAt (most recent first)
        pvs.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });
        
        // Keep the first one (most recent), delete the rest
        for (let i = 1; i < pvs.length; i++) {
          await this.db.delete(cashRegisters).where(eq(cashRegisters.id, pvs[i].id));
          deleted++;
        }
        kept++;
      } else {
        kept++;
      }
    }
    
    return { deleted, kept };
  }
}

export const storage = new DbStorage();
