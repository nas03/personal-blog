import { flag } from "@/constants/consts";
import { UsersLoginTokenRepo } from "@/constants/schema";
import { db, logger } from "@/helpers";
import { Knex } from "knex";

export const getLoginToken = async (user_id: string) => {
  const query = db<UsersLoginTokenRepo>("users_login_token")
    .select("id", "user_id", "session_id", "access_token", "refresh_token", "exp", "iat")
    .where("user_id", user_id)
    .where("delete_flag", flag.FALSE)
    .orderBy("iat", "desc")
    .first();
  return query;
};

export const addLoginToken = async (payload: Omit<UsersLoginTokenRepo, "id">) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx("users_login_token").insert({
        ...payload,
        iat: payload.iat,
        exp: payload.exp,
      });

      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const deleteLoginToken = async (user_id: string) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx<UsersLoginTokenRepo>("users_login_token").where("user_id", user_id).softDelete();

      if (!query) return false;
      return true;
    });
    return transaction;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
