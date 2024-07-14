import { UserProfileRepo } from "@/constants/interfaces";
import { db } from "@/helpers";

export const getUserProfile = async (user_id: string) => {
  const query = await db<UserProfileRepo>("users_profile")
    .select("id", "user_id", "profile_image_url", "address", "country")
    .where("user_id", user_id)
    .first();
  return query;
};

export const createUserProfile = async (payload: UserProfileRepo) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx<UserProfileRepo>("users_profile").insert(payload);
      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const updateUserProfile = async (payload: Partial<Omit<UserProfileRepo, "id">>) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx<UserProfileRepo>("users_profile").update(payload).where("user_id", payload.user_id);
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
    const transaction = await db.transaction(async (trx) => {
      const query = await db<UserProfileRepo>("users_profile").delete().where("user_id", user_id);
      if (!query) return false;
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error);
    return false;
  }
};
