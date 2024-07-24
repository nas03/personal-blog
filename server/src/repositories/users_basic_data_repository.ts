"use strict";
// helpers
import { db } from "@/helpers";
// constants
import { UsersBasicDataRepo, UsersLoginDataRepo } from "@/constants/schema";
// libraries
import { flag } from "@/constants/consts";
import { Knex } from "knex";

const createNewUser = async (payload: Omit<UsersBasicDataRepo, "user_id"> & { hashed_password: string }) => {
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
      };
      const loginData = await trx<UsersLoginDataRepo>("users_login_data").insert(loginDataPayload);
      return true;
    });
    return true;
  } catch (error) {
    console.log(error);
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
export { createNewUser };
