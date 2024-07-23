import { UsersRefreshTokenRepo } from "@/constants/schema";
import { db } from "@/helpers";
import { Knex } from "knex";

export const getRefreshToken = async (user_id: string) => {
  const query = db<UsersRefreshTokenRepo>("users_refresh_token").select("id", "user_id", "refresh_token", "exp", "iat").where("user_id", user_id).first();
  return query;
};

export const addRefreshToken = async (payload: Omit<UsersRefreshTokenRepo, "id">) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx("users_refresh_token").insert({
        ...payload,
        iat: payload.iat,
        exp: payload.exp,
      });

      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const deleteRefreshToken = async (user_id: string) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx<UsersRefreshTokenRepo>("users_refresh_token").where("user_id", user_id).delete();

      if (!query) return false;
      return true;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};
