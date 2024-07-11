import { message } from "@/constants/consts";
import { logger } from "@/helpers";
import { getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    // const userData = users_profile_repository
  } catch (error) {
    logger.error(message.system_error);
  }
};
