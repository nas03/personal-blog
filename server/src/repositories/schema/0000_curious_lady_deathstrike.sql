-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "auth"."aal_level" AS ENUM('aal1', 'aal2', 'aal3');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "auth"."code_challenge_method" AS ENUM('s256', 'plain');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "auth"."factor_status" AS ENUM('unverified', 'verified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "auth"."factor_type" AS ENUM('totp', 'webauthn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "auth"."one_time_token_type" AS ENUM('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "pgsodium"."key_status" AS ENUM('default', 'valid', 'invalid', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "pgsodium"."key_type" AS ENUM('aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "realtime"."action" AS ENUM('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "realtime"."equality_op" AS ENUM('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"comment_id" integer PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"comment" varchar(200) DEFAULT ''::character varying NOT NULL,
	"ts_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"ts_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_access_histories" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"user_agent" varchar(255) NOT NULL,
	"ip_address" "inet" NOT NULL,
	"ts_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"ts_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_category" (
	"id" integer PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"ts_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"ts_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"category_id" integer PRIMARY KEY NOT NULL,
	"title" varchar(255) DEFAULT ''::character varying NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"ts_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"ts_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"post_id" integer PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"thumbnail_url" varchar(255) DEFAULT NULL::character varying NOT NULL,
	"title" varchar(255) DEFAULT ''::character varying NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"ts_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"ts_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_refresh_tokens" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token" text NOT NULL,
	"exp" timestamp NOT NULL,
	"ts_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"ts_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"iat" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_basic_data" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(20) DEFAULT NULL::character varying,
	"hashed_password" varchar(255) NOT NULL,
	"ts_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"ts_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"authorization_id" integer DEFAULT 2 NOT NULL,
	CONSTRAINT "user_email_key" UNIQUE("email"),
	CONSTRAINT "user_phone_number_key" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_profile" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_image_url" text,
	"country" varchar(30) DEFAULT NULL::character varying,
	"address" text,
	"ts_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"ts_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "fk_post" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users_basic_data"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_access_histories" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users_basic_data"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_category" ADD CONSTRAINT "fk_post" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_category" ADD CONSTRAINT "fk_category" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users_basic_data"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users_basic_data"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_profile" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users_basic_data"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/