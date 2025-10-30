import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCashRegisterSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Save cash register data
  app.post("/api/cash-register", async (req, res) => {
    try {
      const data = insertCashRegisterSchema.parse(req.body);
      const saved = await storage.saveCashRegister(data);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get cash register data by date (latest for that day)
  app.get("/api/cash-register/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const data = await storage.getLatestCashRegisterByDate(date);
      if (!data) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all cash registers
  app.get("/api/cash-registers", async (req, res) => {
    try {
      const data = await storage.getAllCashRegisters();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get cash registers by date range
  app.get("/api/cash-registers/range/:startDate/:endDate", async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const data = await storage.getCashRegistersByDateRange(startDate, endDate);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
