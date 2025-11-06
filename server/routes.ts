import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCashRegisterSchema, insertAgencySchema, insertPVConfigurationSchema, insertTransactionCategorySchema, insertUserSchema } from "@shared/schema";

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

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, data);
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

  // Get previous day's solde final for a user
  app.get("/api/previous-solde-final/date/:date/user/:userId", async (req, res) => {
    try {
      const { date, userId } = req.params;
      const soldeFinal = await storage.getPreviousDaySoldeFinal(date, userId);
      res.json({ soldeFinal });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get previous day's total solde final for an agency
  app.get("/api/previous-solde-final/date/:date/agency/:agencyId", async (req, res) => {
    try {
      const { date, agencyId } = req.params;
      const soldeFinal = await storage.getPreviousDayAgencySoldeFinal(date, agencyId);
      res.json({ soldeFinal });
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

  app.post("/api/migrate-solde-depart", async (req, res) => {
    try {
      const result = await storage.migrateAllSoldeDepartAutomatically();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint to check all PVs for a specific user and date
  app.get("/api/debug/pvs/:userId/:date", async (req, res) => {
    try {
      const { userId, date } = req.params;
      const allPVs = await storage.getAllCashRegisters();
      const matchingPVs = allPVs.filter(pv => pv.userId === userId && pv.date === date);
      res.json({
        count: matchingPVs.length,
        pvs: matchingPVs.map(pv => ({
          id: pv.id,
          date: pv.date,
          userId: pv.userId,
          soldeDepart: pv.soldeDepart,
          createdAt: pv.createdAt,
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cleanup endpoint to remove duplicate PVs (keeps only most recent per agent/day)
  app.post("/api/cleanup-duplicates", async (req, res) => {
    try {
      const result = await storage.cleanupDuplicatePVs();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction category routes
  app.get("/api/transaction-categories", async (req, res) => {
    try {
      const categories = await storage.getAllTransactionCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transaction-categories/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const categories = await storage.getTransactionCategoriesByType(type);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transaction-categories", async (req, res) => {
    try {
      const data = insertTransactionCategorySchema.parse(req.body);
      const category = await storage.createTransactionCategory(data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/transaction-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertTransactionCategorySchema.partial().parse(req.body);
      const category = await storage.updateTransactionCategory(id, data);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/transaction-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTransactionCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/initialize-default-categories", async (req, res) => {
    try {
      const existingCategories = await storage.getAllTransactionCategories();
      if (existingCategories.length > 0) {
        return res.json({ message: "Categories already exist", count: existingCategories.length });
      }

      const defaultCategories = [
        { type: "versement", label: "Versement CIH", description: "Dépôt vers CIH Bank" },
        { type: "versement", label: "Versement Attijariwafa Bank", description: "Dépôt vers Attijariwafa Bank" },
        { type: "versement", label: "Versement BMCE", description: "Dépôt vers BMCE Bank" },
        { type: "versement", label: "Versement Banque Populaire", description: "Dépôt vers Banque Populaire" },
        { type: "versement", label: "Alimentation banque", description: "Alimentation du compte bancaire" },
        { type: "versement", label: "Dépôt espèces", description: "Dépôt d'espèces à la banque" },
        { type: "retrait", label: "Retrait vers CIH", description: "Retrait depuis CIH Bank" },
        { type: "retrait", label: "Retrait vers Attijariwafa Bank", description: "Retrait depuis Attijariwafa Bank" },
        { type: "retrait", label: "Retrait vers BMCE", description: "Retrait depuis BMCE Bank" },
        { type: "retrait", label: "Retrait vers Banque Populaire", description: "Retrait depuis Banque Populaire" },
        { type: "retrait", label: "Charges agence", description: "Dépenses de fonctionnement de l'agence" },
        { type: "retrait", label: "Frais bancaires", description: "Frais et commissions bancaires" },
        { type: "retrait", label: "Salaires", description: "Paiement des salaires" },
        { type: "retrait", label: "Fournitures", description: "Achat de fournitures" },
      ];

      const created = [];
      for (const category of defaultCategories) {
        const result = await storage.createTransactionCategory(category);
        created.push(result);
      }

      res.json({ message: "Default categories created successfully", count: created.length, categories: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
