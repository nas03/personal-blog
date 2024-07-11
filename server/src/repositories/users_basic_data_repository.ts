"use strict";
// helpers
import { db, logger } from "@/helpers";
// constants
import { UserBasicData } from "@/constants/interfaces";
// libraries
import { Knex } from "knex";

const getUserData = async (payload: Pick<UserBasicData, "user_id"> | Pick<UserBasicData, "email">) => {
  const query = await db<UserBasicData>("users_basic_data")
    .select("user_id", "authorization_id", "email", "first_name", "last_name", "hashed_password", "phone_number")
    .where((builder) => {
      if ("email" in payload && payload["email"]) {
        return builder.where("email", payload.email);
      }
      if ("user_id" in payload && payload["user_id"]) {
        return builder.where("user_id", payload.user_id);
      }
    })
    .first();
  return query;
};

const updateUserData = async (payload: { user_id: string; options: Partial<Omit<UserBasicData, "user_id">> }) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      return await trx<UserBasicData>("users_basic_data")
        .select("user_id", "email", "first_name", "last_name", "phone_number")
        .update(payload.options)
        .where("user_id", payload.user_id);
    });
    return transaction;
  } catch (error) {
    logger.error("Error updating user");
    return false;
  }
};

const deleteUserData = async (user_id: string) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx<UserBasicData>("users_basic_data").delete().where("user_id", user_id);

      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    logger.error("Error deleting user");
    return false;
  }
};

const createUserData = async (payload: Omit<UserBasicData, "user_id">) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx<UserBasicData>("users").insert(payload);

      if (!query) return false;
      return query;
    });
    return transaction;
    return transaction;
  } catch (error) {
    console.log(error);
    logger.error("Error inserting user");
    return false;
  }
};
export { deleteUserData, updateUserData, getUserData, createUserData };
