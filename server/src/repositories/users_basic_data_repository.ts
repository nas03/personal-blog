"use strict";
// helpers
import { db, logger } from "@/helpers";
// constants
import { UsersBasicDataRepo, UsersLoginDataRepo } from "@/constants/schema";
// libraries
import { flag } from "@/constants/consts";
import { Knex } from "knex";

export const createNewUser = async (payload: Omit<UsersBasicDataRepo, "user_id"> & Omit<UsersLoginDataRepo, "id" | "user_id">) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      // CREATE NEW USER
      const newUserPayload: Omit<UsersBasicDataRepo, "user_id"> = {
        first_name: payload.first_name,
        last_name: payload.last_name,
        authorization_id: payload.authorization_id,
        email: payload.email,
        phone_number: payload.phone_number,
      };
      const newUser = (await trx<UsersBasicDataRepo>("users_basic_data").insert(newUserPayload).returning("*")).at(0);
      if (!newUser) throw Error();

      // CREATE LOGIN DATA FOR NEW USER
      const loginDataPayload: Omit<UsersLoginDataRepo, "id"> = {
        user_id: newUser.user_id,
        hashed_password: payload.hashed_password,
        email: payload.email,
        last_login_date: payload.last_login_date,
        last_login_ip: payload.last_login_ip,
      };
      const loginData = await trx<UsersLoginDataRepo>("users_login_data").insert(loginDataPayload);
      return true;
    });
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const getUserBasicData = async (user_id: string) => {
  const query = await db<UsersBasicDataRepo>("users_basic_data")
    .select("first_name", "last_name", "phone_number", "authorization_id", "user_id")
    .where("delete_flag", flag.FALSE)
    .first();
  return query;
};

export const listUsers = async () => {
  // access_history && image_profile
  const query = await db<UsersBasicDataRepo>("users_basic_data as ubd")
    .leftJoin("users_access_history as uah", "uah.user_id", "ubd.user_id")
    .leftJoin("users_profile", "users_profile.user_id", "ubd.user_id")
    .leftJoin("users_login_data as uld", "uld.user_id", "ubd.user_id")
    .select(
      db.raw("CONCAT (ubd.first_name, ' ', ubd.last_name) AS full_name"),
      "ubd.authorization_id",
      "ubd.email",
      "ubd.phone_number",
      "users_profile.profile_image_url",
      "users_profile.country",
      "users_profile.address",
      "users_profile.stars",
      "uld.last_login_date",
      "uld.last_login_ip"
    );
  return query;
};

export const deleteUserData = async (user_id: string) => {
  try {
    const transaction = await db.transaction(async (trx: Knex.Transaction) => {
      const [users_basic_data, users_login_data] = await Promise.all([
        trx<UsersBasicDataRepo>("users_basic_data").where("user_id", user_id).softDelete(),
        trx<UsersLoginDataRepo>("users_login_data").where("user_id", user_id).softDelete(),
      ]);
    });
    return transaction;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
