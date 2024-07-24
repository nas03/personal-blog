import { UsersProfileRepo } from "@/constants/schema";
import db from "@/helpers/db";
import { Knex } from "knex";

export const getUserProfile = async (user_id: string) => {
  const query = await db<UsersProfileRepo>("users_profile")
    .select("id", "user_id", "profile_image_url", "address", "country")
    .where("user_id", user_id)
    .first();
  return query;
};

export const createUserProfile = async (payload: Partial<UsersProfileRepo> & { user_id: string }) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx<UsersProfileRepo>("users_profile").insert(payload);
      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const updateUserProfile = async (payload: Partial<Omit<UsersProfileRepo, "id">>) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await trx<UsersProfileRepo>("users_profile").update(payload).where("user_id", payload.user_id);
      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const deleteUserProfile = async (user_id: string) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const query = await db<UsersProfileRepo>("users_profile").delete().where("user_id", user_id);
      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};
