import { relations } from "drizzle-orm";
import { otp, users } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  otps: many(otp),
}));
