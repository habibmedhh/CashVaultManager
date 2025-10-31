import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCashRegisterSchema, insertAgencySchema, insertPVConfigurationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Agency routes
  app.get("/api/agencies", async (req, res) => {
    try {
      const agencies = await storage.getAllAgencies();
      res.json(agencies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agencies", async (req, res) => {
    try {
      const data = insertAgencySchema.parse(req.body);
      const agency = await storage.createAgency(data);
      res.json(agency);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/agencies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const agency = await storage.getAgency(id);
      if (!agency) {
        return res.status(404).json({ error: "Agency not found" });
      }
      res.json(agency);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User routes
  app.get("/api/users/all", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/agency/:agencyId", async (req, res) => {
    try {
      const { agencyId } = req.params;
      const users = await storage.getUsersByAgency(agencyId);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

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

  // Get cash registers by user
  app.get("/api/cash-registers/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const data = await storage.getCashRegistersByUser(userId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get cash registers by agency
  app.get("/api/cash-registers/agency/:agencyId", async (req, res) => {
    try {
      const { agencyId } = req.params;
      const data = await storage.getCashRegistersByAgency(agencyId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get latest cash register by date and user
  app.get("/api/cash-register/:date/user/:userId", async (req, res) => {
    try {
      const { date, userId } = req.params;
      const data = await storage.getLatestCashRegisterByDateAndUser(date, userId);
      if (!data) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PV Configuration routes
  app.get("/api/pv-configuration", async (req, res) => {
    try {
      const config = await storage.getPVConfiguration();
      if (!config) {
        // Return default configuration if none exists
        return res.json({
          operationsInData: JSON.stringify([
            { name: "Change", defaultNumber: 0 },
            { name: "Recharge", defaultNumber: 0 },
            { name: "PayExpress", defaultNumber: 0 },
            { name: "SpeedBox", defaultNumber: 0 },
            { name: "CTM", defaultNumber: 0 },
            { name: "Connexions", defaultNumber: 0 },
            { name: "Alimentation", defaultNumber: 0 },
          ]),
          operationsOutData: JSON.stringify([]),
        });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/pv-configuration", async (req, res) => {
    try {
      const data = insertPVConfigurationSchema.parse(req.body);
      const config = await storage.savePVConfiguration(data);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/pv-configuration/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertPVConfigurationSchema.parse(req.body);
      const config = await storage.updatePVConfiguration(id, data);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
