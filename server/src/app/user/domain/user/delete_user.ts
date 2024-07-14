import { code, message } from "@/constants/consts";
import { users_basic_data_repository } from "@/repositories";
import { createResponse, getUserIdByToken } from "@/utilities";
import { NoSuchKey } from "@aws-sdk/client-s3";
import { Request, Response } from "express";

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user_id = getUserIdByToken(req);
    if (!user_id) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    const responseDeleteUser = await users_basic_data_repository.deleteUserData(user_id);
    if (!responseDeleteUser) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    return createResponse(res, true);
  } catch (error) {
    console.log(error);
    return createResponse(res, false, null, code.ERROR, message.system_error);
  }
};
