import { authorization, code, message } from "@/constants/consts";
import { logger } from "@/helpers";
import { users_basic_data_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const listUsers = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    const userData = await users_basic_data_repository.getUserBasicData(user_id);
    if (!userData || userData.authorization_id !== authorization.SYSTEM_ADMINISTRATOR) {
      return createResponse(res, false, null, code.FORBIDDEN, message.user_forbidden);
    }

    const responseListUser = await users_basic_data_repository.listUsers();

    return createResponse(res, true, responseListUser);
  } catch (error) {
    logger.error(error)
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
