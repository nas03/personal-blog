import { RefreshToken } from "@/constants/interfaces";
import { db } from "@/helpers";
export const getRefreshToken = async (user_id: string) => {
  const query = await db<RefreshToken>("user_refresh_tokens").select("id", "refresh_token", "exp", "iat");
  return query;
};

export const addRefreshToken = async (payload: Omit<RefreshToken, "id" | "ts_registered" | "ts_updated">) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx("user_refresh_tokens").insert({
        ...payload,
        iat: new Date(payload.iat),
        exp: new Date(payload.exp)
      });
      if (!query) {
        return false;
      }
      return query;
    });
    return transaction;
  } catch (error) {
    console.log(error)
    return false;
  }
};

export const deleteRefreshToken = async (user_id: string) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const query = await trx<RefreshToken>("user_refresh_tokens").where("user_id", user_id).delete();
      if (!query) {
        return false;
      }
      return true;
    });
    return transaction;
  } catch (error) {
    console.log(error)
    return false;
  }
};
