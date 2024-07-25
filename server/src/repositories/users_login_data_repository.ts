import { flag } from "@/constants/consts";
import { UsersLoginDataRepo } from "@/constants/schema";
import { db, logger } from "@/helpers";
import { Knex } from "knex";

export const getUserLoginData = async (email: string) => {
  const query = await db<UsersLoginDataRepo>("users_login_data")
    .leftJoin("users_basic_data", "users_basic_data.user_id", "users_login_data.user_id")
    .select("users_basic_data.user_id", "users_login_data.email", "users_login_data.hashed_password")
    .where({ "users_login_data.email": email, "users_login_data.delete_flag": flag.FALSE })
    .first();
  return query;
};

export const createUserLoginData = async (payload: Omit<UsersLoginDataRepo, "id">) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx<UsersLoginDataRepo>("users_login_data").insert(payload).returning("*");
      return query;
    });
    return transaction[0];
  } catch (error) {
    logger.error(error);
    return false;
  }
};


export const deleteUserLoginData = async (user_id: string) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx<UsersLoginDataRepo>("users_login_data").where("user_id", user_id).softDelete();
    });
    return transaction;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
