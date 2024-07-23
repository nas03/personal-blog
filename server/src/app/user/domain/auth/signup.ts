// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
// Utilities
import { createResponse, emailValidator, getErrorMsg, phoneNumberValidator, zodValidate } from "@/utilities";
// Constants
import { authorization, code, message, zodError } from "@/constants/consts";
// Interfaces
import { UsersBasicDataRepo, UsersLoginDataRepo } from "@/constants/schema";
// Repository
import { users_basic_data_repository, users_login_data_repository } from "@/repositories";
// library
import { z } from "zod";
// helper

const ValidateSchema = z.object({
  first_name: z.string(zodError),
  last_name: z.string(zodError),
  email: z.string(zodError).email({ message: zodError.invalid_type_error }),
  password: z.string(zodError),
  phone_number: z.string(zodError),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const data = zodValidate(req.body, ValidateSchema);

    if (!emailValidator(data.email) || !phoneNumberValidator(data.phone_number)) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_invalid);
    }

    // CREATE USER BASIC DATA
    const userPayload: Omit<UsersBasicDataRepo, "user_id"> = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      authorization_id: authorization.USER,
      phone_number: data.phone_number,
    };
    await users_basic_data_repository
      .createUserData(userPayload)
      .then(async (newUser) => {
        if (!newUser) {
          return createResponse(res, false, null, code.ERROR, message.system_error);
        }

        // CREATE LOGIN DATA
        const user_id = newUser.user_id;
        const hashed_password = await bcryptjs.hash(data.password, 10);
        const loginPayload: Omit<UsersLoginDataRepo, "id"> = {
          user_id: user_id,
          hashed_password: hashed_password,
          email: newUser.email,
        };
        const newLoginData = await users_login_data_repository.createUserLoginData(loginPayload);
        if (!newLoginData) {
          return createResponse(res, false, null, code.ERROR, message.system_error);
        }
      })
      .catch((error) => {
        return createResponse(res, false, null, code.ERROR, message.system_error);
      });

    return createResponse(res, true);
  } catch (error) {
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

// SSO
