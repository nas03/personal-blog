// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import moment from "moment";
import { z } from "zod";
// Repository
import { users_login_data_repository, users_refresh_token_repository } from "@/repositories";
// Constants
import { code, message, zodError } from "@/constants/consts";
// Utility
import { createAccessToken, createRefreshToken, createResponse, getErrorMsg, zodValidate } from "@/utilities";

const ValidateSchema = z.object({
  email: z.string(zodError).email({ message: zodError.invalid_type_error }),
  password: z.string(zodError).min(1, { message: zodError.invalid_type_error }),
  staySignedIn: z.boolean(zodError),
});

export const login = async (req: Request, res: Response) => {
  try {
    const data = zodValidate(req.body, ValidateSchema);

    const userData = await users_login_data_repository.getUserLoginData(data.email);
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
      const exp = Math.floor(Date.now() / 1000) + moment.duration(1, "day").asSeconds();
      const iat = Math.floor(Date.now() / 1000);
      console.log({ exp, iat });
      const refreshToken = createRefreshToken({
        user_id: userData.user_id,
        email: userData.email,
        exp: exp,
        iat: iat,
      });

      res.cookie(String(process.env.REFRESH_COOKIE_NAME), refreshToken, {
        httpOnly: true,
        maxAge: moment.duration(1, "day").asSeconds(),
        sameSite: "strict",
        secure: true,
      });

      await users_refresh_token_repository.addRefreshToken({
        user_id: userData.user_id,
        refresh_token: refreshToken,
        exp: exp,
        iat: iat,
      });
    }

    const payload = { accessToken: accessToken };
    return createResponse(res, true, payload);
  } catch (error) {
    console.log(error);
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

// SSO
// Authenticator
