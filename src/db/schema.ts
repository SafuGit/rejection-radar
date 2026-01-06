import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
})

export const otp = pgTable("otp", {
  id: serial("id").primaryKey(),
  otp: text("otp").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresIn: timestamp("expires_in").notNull(),
});
