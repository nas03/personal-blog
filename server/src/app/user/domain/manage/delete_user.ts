import { zodError } from "@/constants/consts";
import { users_login_data_repository } from "@/repositories";
import { createResponse, getErrorMsg, zodValidate } from "@/utilities";
import { Request, Response } from "express";
import { z } from "zod";

export const deleteUser = async (req: Request, res: Response) => {
  try {
    // VALIDATE PARAMS
    const validateSchema = z.object({user_id: z.string(zodError).uuid(zodError.invalid_type_error)})
    const validate = zodValidate(req.params, validateSchema)

    const user_id = validate.user_id;
    
    // DELETE USER DATA
    const deleteUser = await users_login_data_repository.deleteUserLoginData(user_id);
    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
