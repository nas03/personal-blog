import { users_login_data_repository } from "@/repositories";
import { createResponse, getErrorMsg } from "@/utilities";
import { Request, Response } from "express";

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user_id = req.params["user_id"];
    const deleteUser = await users_login_data_repository.deleteUserLoginData(user_id);
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
