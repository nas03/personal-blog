import { authorization, code, message } from "@/constants/consts";
import { users_basic_data_repository } from "@/repositories";
import { createResponse, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const getAllUser = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    if (!user_id) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }

    const userData = await users_basic_data_repository.getUserData({ user_id });
    if (userData?.authorization_id !== authorization.SYSTEM_ADMINISTRATOR) {
      return createResponse(res, false, null, code.FORBIDDEN, message.user_forbidden);
    }

    const responseAllUserData = await users_basic_data_repository.findAll();

    return createResponse(res, true, responseAllUserData);
  } catch (error) {
    console.log(error);
    return createResponse(res, false, null, code.ERROR, message.system_error);
  }
};
