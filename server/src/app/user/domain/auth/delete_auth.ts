import { users_login_data_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const deleteAuth = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    await users_login_data_repository.deleteUserLoginData(user_id);
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
