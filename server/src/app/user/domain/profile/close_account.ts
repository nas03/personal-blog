import { code, message } from "@/constants/consts";
import { users_basic_data_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const closeAccount = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);

    const closeAccount = await users_basic_data_repository.deleteUserData(user_id);
    if (!closeAccount) return createResponse(res, false, null, code.ERROR, message.update_failed);

    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
