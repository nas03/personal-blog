import { ErrorLog } from "@/constants/common";
import { authorization, code, message } from "@/constants/consts";
import { users_basic_data_repository } from "@/repositories";
import { createResponse, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const getAllUser = async (req: Request, res: Response) => {
  try {
    const admin_id = getUserIdByToken(req);
    const adminData = await users_basic_data_repository.getUserData({ user_id: admin_id });
    if (!adminData || adminData.authorization_id !== authorization.SYSTEM_ADMINISTRATOR) {
      return createResponse(res, false, null, code.FORBIDDEN, message.user_forbidden);
    }

    const responseAllUserData = await users_basic_data_repository.findAll();

    return createResponse(res, true, { responseAllUserData });
  } catch (error) {
    const { message: errMessage, code: errCode } = error as ErrorLog;
    const responseCode = message.hasOwnProperty(errMessage) ? errCode : code.ERROR;
    const responseMessage = message.hasOwnProperty(errMessage) ? errMessage : message.system_error;

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
