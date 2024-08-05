import { Knex } from "knex";

import dotenv from "dotenv";
dotenv.config();
const platform = String(process.env.DEV_PLATFORM) || "macOS";
const knexConfig: { [key: string]: Knex.Config } = {
  local: {
    client: "pg",
    connection: {
      host: "localhost",
      user: process.env.LOCAL_DB_USERNAME,
      password: process.env.LOCAL_DB_PASSWORD,
      database: process.env.LOCAL_DB_NAME,
      port: 5433,
      ssl: {
        rejectUnauthorized: false,

      },
      
    },
  },
  production: {
    client: "pg",
    connection: {
      host: process.env.AWS_RDS_ENDPOINT,
      user: process.env.AWS_RDS_USERNAME,
      password: process.env.AWS_RDS_PASSWORD,
      database: process.env.AWS_RDS_DB_NAME,
      port: Number(process.env.AWS_RDS_PORT),
    },
  },
};

export default knexConfig;
