import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const diaryEntries = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEntrySchema = createInsertSchema(diaryEntries)
  .pick({
    title: true,
    content: true,
  })
  .extend({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertEntry = z.infer<typeof insertEntrySchema>;
