import { type User, type InsertUser, type CashRegister, type InsertCashRegister } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

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

export const storage = new MemStorage();
