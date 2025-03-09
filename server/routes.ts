import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEntrySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Diary entry routes
  app.get("/api/entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const entries = await storage.getEntries(req.user.id);
    res.json(entries);
  });

  app.post("/api/entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const validated = insertEntrySchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json(validated.error);
    }

    const entry = await storage.createEntry(req.user.id, validated.data);
    res.status(201).json(entry);
  });

  app.get("/api/entries/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const entry = await storage.getEntry(parseInt(req.params.id));
    if (!entry) {
      return res.sendStatus(404);
    }
    if (entry.userId !== req.user.id) {
      return res.sendStatus(403);
    }
    
    res.json(entry);
  });

  app.patch("/api/entries/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const entry = await storage.getEntry(parseInt(req.params.id));
    if (!entry) {
      return res.sendStatus(404);
    }
    if (entry.userId !== req.user.id) {
      return res.sendStatus(403);
    }

    const validated = insertEntrySchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json(validated.error);
    }

    const updated = await storage.updateEntry(parseInt(req.params.id), validated.data);
    res.json(updated);
  });

  app.delete("/api/entries/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const entry = await storage.getEntry(parseInt(req.params.id));
    if (!entry) {
      return res.sendStatus(404);
    }
    if (entry.userId !== req.user.id) {
      return res.sendStatus(403);
    }

    await storage.deleteEntry(parseInt(req.params.id));
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}
