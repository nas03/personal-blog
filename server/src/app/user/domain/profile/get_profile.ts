import { code, message } from "@/constants/consts";
import { logger } from "@/helpers";
import { users_profile_repository } from "@/repositories";
import { createResponse, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    if (!user_id) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }
    const userData = users_profile_repository.getUserProfile(String(user_id));
    if (!userData) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }
    return createResponse(res, true, { userData });
  } catch (error) {
    logger.error(message.system_error);
    return createResponse(res, false, null, code.ERROR, message.system_error);
  }
};
