import { authorization, code, message, zodError } from "@/constants/consts";
import { users_basic_data_repository, users_login_data_repository } from "@/repositories";
import { createResponse, getErrorMsg, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

export const deleteUser = async (req: Request, res: Response) => {
  try {
    // VALIDATE PARAMS
    const validateSchema = z.object({ user_id: z.string(zodError).uuid(zodError.invalid_type_error) });
    const validate = zodValidate(req.params, validateSchema);
    const user_id = validate.user_id;

    // VERIFY USER PERMISSION
    const userData = await users_basic_data_repository.getUserBasicData(user_id);
    if (!userData || userData.authorization_id !== authorization.SYSTEM_ADMINISTRATOR) {
      return createResponse(res, false, null, code.FORBIDDEN, message.user_forbidden);
    }
    
    // DELETE USER DATA
    const deleteUser = await users_login_data_repository.deleteUserData(user_id);
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
