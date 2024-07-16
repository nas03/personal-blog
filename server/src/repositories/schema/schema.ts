import { pgTable, foreignKey, pgEnum, integer, uuid, varchar, timestamp, inet, text, unique } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const aal_level = pgEnum("aal_level", ['aal1', 'aal2', 'aal3'])
export const code_challenge_method = pgEnum("code_challenge_method", ['s256', 'plain'])
export const factor_status = pgEnum("factor_status", ['unverified', 'verified'])
export const factor_type = pgEnum("factor_type", ['totp', 'webauthn'])
export const one_time_token_type = pgEnum("one_time_token_type", ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])
export const key_status = pgEnum("key_status", ['default', 'valid', 'invalid', 'expired'])
export const key_type = pgEnum("key_type", ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const action = pgEnum("action", ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const equality_op = pgEnum("equality_op", ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])


export const comments = pgTable("comments", {
	comment_id: integer("comment_id").primaryKey().notNull(),
	post_id: integer("post_id").notNull().references(() => posts.post_id, { onDelete: "cascade" } ),
	user_id: uuid("user_id").notNull().references(() => users_basic_data.user_id, { onDelete: "cascade" } ),
	comment: varchar("comment", { length: 200 }).notNull(),
	ts_updated: timestamp("ts_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	ts_created: timestamp("ts_created", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const user_access_histories = pgTable("user_access_histories", {
	id: integer("id").primaryKey().notNull(),
	user_id: uuid("user_id").notNull().references(() => users_basic_data.user_id, { onDelete: "cascade" } ),
	user_agent: varchar("user_agent", { length: 255 }).notNull(),
	ip_address: inet("ip_address").notNull(),
	ts_updated: timestamp("ts_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	ts_created: timestamp("ts_created", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const post_category = pgTable("post_category", {
	id: integer("id").primaryKey().notNull(),
	post_id: integer("post_id").notNull().references(() => posts.post_id, { onDelete: "cascade" } ),
	category_id: integer("category_id").notNull().references(() => categories.category_id, { onDelete: "cascade" } ),
	ts_updated: timestamp("ts_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	ts_created: timestamp("ts_created", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const categories = pgTable("categories", {
	category_id: integer("category_id").primaryKey().notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description").default('').notNull(),
	ts_updated: timestamp("ts_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	ts_created: timestamp("ts_created", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const posts = pgTable("posts", {
	post_id: integer("post_id").primaryKey().notNull(),
	user_id: uuid("user_id").notNull().references(() => users_basic_data.user_id, { onDelete: "cascade" } ),
	thumbnail_url: varchar("thumbnail_url", { length: 255 }),
	title: varchar("title", { length: 255 }).notNull(),
	content: text("content").default('').notNull(),
	ts_updated: timestamp("ts_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	ts_created: timestamp("ts_created", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const user_refresh_tokens = pgTable("user_refresh_tokens", {
	id: integer("id").primaryKey().notNull(),
	user_id: uuid("user_id").notNull().references(() => users_basic_data.user_id, { onDelete: "cascade" } ),
	refresh_token: text("refresh_token").notNull(),
	exp: timestamp("exp", { mode: 'string' }).notNull(),
	ts_updated: timestamp("ts_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	ts_created: timestamp("ts_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	iat: timestamp("iat", { mode: 'string' }),
});

export const users_basic_data = pgTable("users_basic_data", {
	user_id: uuid("user_id").defaultRandom().primaryKey().notNull(),
	first_name: varchar("first_name", { length: 100 }).notNull(),
	last_name: varchar("last_name", { length: 100 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	phone_number: varchar("phone_number", { length: 20 }),
	hashed_password: varchar("hashed_password", { length: 255 }).notNull(),
	ts_updated: timestamp("ts_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
	ts_created: timestamp("ts_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	authorization_id: integer("authorization_id").default(2).notNull(),
},
(table) => {
	return {
		user_email_key: unique("user_email_key").on(table.email),
		user_phone_number_key: unique("user_phone_number_key").on(table.phone_number),
	}
});

export const users_profile = pgTable("users_profile", {
	id: integer("id").primaryKey().notNull(),
	user_id: uuid("user_id").notNull().references(() => users_basic_data.user_id, { onDelete: "cascade" } ),
	profile_image_url: text("profile_image_url"),
	country: varchar("country", { length: 30 }),
	address: text("address"),
	ts_created: timestamp("ts_created", { withTimezone: true, mode: 'string' }).defaultNow(),
	ts_updated: timestamp("ts_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
});