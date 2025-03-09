import { User, InsertUser, DiaryEntry, InsertEntry } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Diary entries
  createEntry(userId: number, entry: InsertEntry): Promise<DiaryEntry>;
  getEntries(userId: number): Promise<DiaryEntry[]>;
  getEntry(id: number): Promise<DiaryEntry | undefined>;
  updateEntry(id: number, entry: InsertEntry): Promise<DiaryEntry>;
  deleteEntry(id: number): Promise<void>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private entries: Map<number, DiaryEntry>;
  private currentUserId: number;
  private currentEntryId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.entries = new Map();
    this.currentUserId = 1;
    this.currentEntryId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createEntry(userId: number, entry: InsertEntry): Promise<DiaryEntry> {
    const id = this.currentEntryId++;
    const now = new Date();
    const newEntry: DiaryEntry = {
      id,
      userId,
      ...entry,
      createdAt: now,
      updatedAt: now,
    };
    this.entries.set(id, newEntry);
    return newEntry;
  }

  async getEntries(userId: number): Promise<DiaryEntry[]> {
    return Array.from(this.entries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getEntry(id: number): Promise<DiaryEntry | undefined> {
    return this.entries.get(id);
  }

  async updateEntry(id: number, entry: InsertEntry): Promise<DiaryEntry> {
    const existing = this.entries.get(id);
    if (!existing) {
      throw new Error("Entry not found");
    }
    
    const updated: DiaryEntry = {
      ...existing,
      ...entry,
      updatedAt: new Date(),
    };
    this.entries.set(id, updated);
    return updated;
  }

  async deleteEntry(id: number): Promise<void> {
    this.entries.delete(id);
  }
}

export const storage = new MemStorage();
