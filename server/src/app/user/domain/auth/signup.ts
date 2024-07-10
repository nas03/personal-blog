import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { createResponse, validateFields, emailValidator, phoneNumberValidator } from "@/utilities";
import { code, message } from "@/constants";
import { user_repository } from "@/repositories";
import { User } from "@/constants";

type SignUpData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, phone_number }: SignUpData = req.body;

    const fields: string[] = ["first_name", "last_name", "email", "password", "phone_number"];
    const validate = validateFields(req.body, fields);

    if (!validate) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_cannot_blank);
    }

    if (!emailValidator(email) || !phoneNumberValidator(phone_number)) {
      return createResponse(res, false, null, code.BAD_REQUEST, message.fields_invalid);
    }

    const hashed_password = await bcryptjs.hash(password, 10);

    const payload: Omit<User, "user_id" | "ts_updated" | "ts_registered"> = {
      first_name: first_name,
      last_name: last_name,
      hashed_password: hashed_password,
      email: email,
      is_admin: false,
      phone_number: phone_number,
    };
    const newUser = await user_repository.createUserData(payload);

    if (!newUser) {
      return createResponse(res, false, null, code.ERROR, message.system_error);
    }

    return createResponse(res, true);
  } catch (error) {
    return createResponse(res, false, null, code.ERROR, message.system_error);
  }
};
