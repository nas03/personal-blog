import { Config, defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();
const drizzleConfig = defineConfig({
  schema: "src/repositories/schema.ts",
  dialect: "postgresql",
  introspect: {
    casing: "preserve",
  },
  out: "src/repositories/schema",
  dbCredentials: {
    /* host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME, */
    url: process.env.DB_URL
  },
  verbose: true,
  strict: true,
} as Config);

export default drizzleConfig;
