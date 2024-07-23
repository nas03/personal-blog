import dotenv from "dotenv";
import knex from "knex";

import { attachPaginate } from "knex-paginate";
import knexConfig from "./knex";
dotenv.config();

attachPaginate();
const environment = process.env.NODE_ENV || "development";
const db = knex(knexConfig[environment]);

db.fn.now();

export const now = () => db.fn.now();

export default db;
