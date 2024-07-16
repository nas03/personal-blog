/* import { pgTable, serial, text, integer, uuid, varchar, timestamp, inet, PgTable } from "drizzle-orm/pg-core";

export const users_basic_data = pgTable("users_basic_data", {
  user_id: uuid("user_id").defaultRandom().primaryKey(),
  fist_name: varchar("fist_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone_number: varchar("phone_number", { length: 20 }),
  hashed_password: varchar("hashed_password", { length: 255 }).notNull(),
  authorization_id: integer("authorization_id").notNull(),
  ts_updated: timestamp("ts_updated", { withTimezone: true }).defaultNow(),
  ts_created: timestamp("ts_created", { withTimezone: true }).defaultNow(),
});

export const categories = pgTable("categories", {
  category_id: integer("category_id").generatedAlwaysAsIdentity().primaryKey(),
  title: varchar("title", { length: 255 }).notNull().default(""),
  description: text("description").default("").notNull(),
  ts_updated: timestamp("ts_updated", { withTimezone: true }).defaultNow(),
  ts_created: timestamp("ts_created", { withTimezone: true }).defaultNow(),
});

export const posts = pgTable("posts", {
  post_id: integer("post_id").generatedAlwaysAsIdentity().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users_basic_data.user_id, {
      onDelete: "cascade",
    }),
  thumbnail_url: varchar("thumbnail_url", { length: 255 }).default("").notNull(),
  title: varchar("title", { length: 255 }).notNull().default(""),
  content: text("content").default("").notNull(),
  ts_updated: timestamp("ts_updated", { withTimezone: true }).defaultNow(),
  ts_created: timestamp("ts_created", { withTimezone: true }).defaultNow(),
});

export const comments = pgTable("comments", {
  comment_id: integer("comment_id").generatedAlwaysAsIdentity().primaryKey().notNull(),
  post_id: integer("post_id")
    .notNull()
    .references(() => posts.post_id, {
      onDelete: "cascade",
    }),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users_basic_data.user_id, {
      onDelete: "cascade",
    }),
  comment: varchar("comment", { length: 200 }).default("").notNull(),
  ts_updated: timestamp("ts_updated", { withTimezone: true }).defaultNow(),
  ts_created: timestamp("ts_created", { withTimezone: true }).defaultNow(),
});

export const post_category = pgTable("post_category", {
  id: integer("id").gene().primaryKey(),
  post_id: integer("post_id")
    .notNull()
    .references(() => posts.post_id, {
      onDelete: "cascade",
    }),
  category_id: integer("category_id")
    .notNull()
    .references(() => categories.category_id, {
      onDelete: "cascade",
    }),
  ts_updated: timestamp("ts_updated", { withTimezone: true }).defaultNow(),
  ts_created: timestamp("ts_created", { withTimezone: true }).defaultNow(),
});

export const user_access_histories = pgTable("user_access_histories", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users_basic_data.user_id, {
      onDelete: "cascade",
    }),
  user_agent: varchar("user_agent", { length: 255 }).notNull(),
  ip_address: inet("ip_address").notNull(),
  ts_updated: timestamp("ts_updated", { withTimezone: true }).defaultNow(),
  ts_created: timestamp("ts_created", { withTimezone: true }).defaultNow(),
});

export const user_refresh_tokens = pgTable("user_refresh_tokens", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users_basic_data.user_id, {
      onDelete: "cascade",
    }),
  refresh_token: text("refresh_token").notNull(),
  exp: timestamp("exp", { withTimezone: false }).notNull(),
  iat: timestamp("exp", { withTimezone: false }).notNull(),
  ts_updated: timestamp("ts_updated", { withTimezone: true }).defaultNow(),
  ts_created: timestamp("ts_created", { withTimezone: true }).defaultNow(),
});

export const users_profile = pgTable("users_profile", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users_basic_data.user_id, {
      onDelete: "cascade",
    }),
  profile_image_url: text("profile_image_url"),
  country: varchar("country", { length: 30 }),
  address: text("address"),
  ts_updated: timestamp("ts_updated", { withTimezone: true }).defaultNow(),
  ts_created: timestamp("ts_created", { withTimezone: true }).defaultNow(),
});
 */