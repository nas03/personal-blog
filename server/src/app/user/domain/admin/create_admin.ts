import { authorization, code, message } from "@/constants/consts";
import { UsersBasicDataRepo, UsersBasicDataSchema, UsersLoginDataRepo } from "@/constants/schema";
import { logger } from "@/helpers";
import { users_basic_data_repository } from "@/repositories";
import { createResponse, getErrorMsg, getUserIdByToken, zodValidate } from "@/utilities";
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { z } from "zod";

export const createAdmin = async (req: Request, res: Response) => {
  try {
    // VERIFY USER PERMISSION
    const user_id = getUserIdByToken(req);
    const userData = await users_basic_data_repository.getUserBasicData(user_id);
    if (!userData || userData.authorization_id !== authorization.SYSTEM_ADMINISTRATOR) {
      return createResponse(res, false, null, code.FORBIDDEN, message.user_forbidden);
    }

    // VALIDATE PARAMS
    const validateSchema = UsersBasicDataSchema.omit({ user_id: true }).merge(z.object({ password: z.string() }));
    const validate = zodValidate(req.body, validateSchema);

    // NEW ADMIN DATA
    const hashed_password = await bcryptjs.hash(validate.password, 15);
    const payload: Omit<UsersBasicDataRepo, "user_id"> & Omit<UsersLoginDataRepo, "id" | "user_id"> = {
      ...validate,
      authorization_id: authorization.SYSTEM_ADMINISTRATOR,
      hashed_password: hashed_password,
      last_login_date: null,
      last_login_ip: req.ip || "",
    };

    const responseCreateAdmin = await users_basic_data_repository.createNewUser(payload);
    if (!responseCreateAdmin) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    return createResponse(res, true);
  } catch (error) {
    logger.error(error);
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
