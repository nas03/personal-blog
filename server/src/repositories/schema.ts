import { pgTable, serial, text,integer, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  user_id: uuid("user_id").defaultRandom().primaryKey(),
  fist_name: varchar("fist_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone_number: varchar('phone_number', {length: 20}),
  hashed_password: varchar('hashed_password', {length: 255}).notNull(),
  authorization_id: integer('authorization_id').notNull(),
  ts_updated: timestamp("ts_updated",{withTimezone: true}).defaultNow(),
  ts_registered: timestamp("ts_registered",{withTimezone: true}).defaultNow()
});
