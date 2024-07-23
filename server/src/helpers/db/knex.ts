import { Knex } from "knex";

import dotenv from "dotenv";
dotenv.config();
const knexConfig: { [key: string]: Knex.Config } = {
  local: {
    client: "pg",
    connection: {
      host: "localhost",
      user: "postgres",
      password: String(process.env.DB_LOCAL_PASSWORD),
      database: "personal_blog",
      port: 5432,
    },
    debug: true,
  },
  development: {
    client: "pg",
    connection: {
      host: String(process.env.DB_HOST),
      user: String(process.env.DB_USER),
      password: String(process.env.DB_PASSWORD),
      database: String(process.env.DB_NAME),
      port: Number(process.env.DB_PORT),
      debug: true,
    },
    debug: true,
    searchPath: "public",
    pool: {
      min: 0,
      max: 10,
      /* afterCreate: (conn: any, done: any) => {
        console.log(conn);
        done(conn);
      }, */
    },
  },
  production: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
    },
  },
};

export default knexConfig;
