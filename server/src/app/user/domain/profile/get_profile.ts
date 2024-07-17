import { ErrorLog } from "@/constants/common";
import { code, message } from "@/constants/consts";
import { users_profile_repository } from "@/repositories";
import { createResponse, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    const userData = users_profile_repository.getUserProfile(user_id);
    if (!userData) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }
    return createResponse(res, true, { userData });
  } catch (error) {
   const {responseCode, responseMessage} = getErrorMsg(error as Error)

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
