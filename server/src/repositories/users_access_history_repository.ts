import { UsersAccessHistoryRepo } from "@/constants/schema";
import { db, logger } from "@/helpers";

export const createAccessHistory = async (payload: Omit<UsersAccessHistoryRepo, "id">) => {
  try {
    const transaction = await db.transaction(async (trx) => {
      const newAccessLog = await trx<UsersAccessHistoryRepo>("users_access_history").insert(payload);
      if (!newAccessLog) return false;
      return true;
    });
    return transaction;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
