import { authorization, code, message, zodError } from "@/constants/consts";
import { users_basic_data_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

const ValidateSchema = z.object({
  user_id: z.string(zodError),
});

export const deleteUser = async (req: Request, res: Response) => {
  try {
    // VALIDATE ADMIN
    const admin_id = getUserIdByToken(req);
    const adminData = await users_basic_data_repository.getUserData({
      user_id: admin_id,
    });
    if (!adminData || adminData.authorization_id !== authorization.SYSTEM_ADMINISTRATOR) {
      return createResponse(res, false, null, code.FORBIDDEN, message.user_forbidden);
    }

    // VALIDATE TARGET_ID
    const data = zodValidate(req.params, ValidateSchema);

    // DELETE TARGET FROM DB
    const target_id = data.user_id;
    const responseDeleteUser = await users_basic_data_repository.deleteUserData(target_id);
    if (!responseDeleteUser) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
