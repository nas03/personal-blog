// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import moment from "moment";
import { z } from "zod";
// Repository
import { user_refresh_tokens_repository, users_basic_data_repository } from "@/repositories";
// Constants
import { code, message, zodError } from "@/constants/consts";
// Utility
import { ErrorLog } from "@/constants/common";
import { createAccessToken, createRefreshToken, createResponse, zodValidate } from "@/utilities";

const DataSchema = z.object({
  email: z.string(zodError).email({ message: zodError.invalid_type_error }),
  password: z.string(zodError).min(1, { message: zodError.invalid_type_error }),
  staySignedIn: z.boolean(zodError),
});

export const login = async (req: Request, res: Response) => {
  try {
    const data = zodValidate(req.body, DataSchema);

    const userData = await users_basic_data_repository.getUserData({
      email: data.email,
    });
    if (!userData) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.user_not_exists);
    }

    const validatePassword = bcryptjs.compare(data.password, userData.hashed_password);
    if (!validatePassword) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }

    const accessToken = createAccessToken({
      user_id: userData.user_id,
      email: userData.email,
    });

    if (data.staySignedIn) {
      const exp = Math.floor(Date.now() / 1000 + moment.duration("1d").asSeconds());
      const iat = Math.floor(Date.now() / 1000);

      const refreshToken = createRefreshToken({
        user_id: userData.user_id,
        email: userData.email,
        exp: exp,
        iat: iat,
      });

      res.cookie(String(process.env.REFRESH_COOKIE_NAME), refreshToken, {
        httpOnly: true,
        maxAge: moment.duration(1, "d").asSeconds(),
        sameSite: "strict",
        secure: true,
      });

      await user_refresh_tokens_repository.addRefreshToken({
        user_id: userData.user_id,
        refresh_token: refreshToken,
        exp: exp,
        iat: iat,
      });
    }
    return createResponse(res, true, { accessToken });
  } catch (error) {
    const { message: errMessage, code: errCode } = error as ErrorLog;
    const responseCode = message.hasOwnProperty(errMessage) ? errCode : code.ERROR;
    const responseMessage = message.hasOwnProperty(errMessage) ? errMessage : message.system_error;

    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

// SSO
// Authenticator
