// Library
import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import moment from "moment";
import { v4 as uuidV4 } from "uuid";
import { z } from "zod";
// Repository
import { users_access_history_repository, users_login_data_repository, users_login_token_repository } from "@/repositories";
// Constants
import { code, message, zodError } from "@/constants/consts";
// Utility
import { UsersAccessHistoryRepo } from "@/constants/schema";
import { logger } from "@/helpers";
import { createAccessToken, createRefreshToken, createResponse, getErrorMsg, getOsData, zodValidate } from "@/utilities";

export const login = async (req: Request, res: Response) => {
  try {
    // VALIDATE LOGIN PARAMS
    const validateSchema = z.object({
      email: z.string(zodError).email({ message: zodError.invalid_type_error }),
      password: z.string(zodError).min(1, { message: zodError.invalid_type_error }),
      staySignedIn: z.boolean(zodError),
    });
    const data = zodValidate(req.body, validateSchema);

    // CHECK USER EXISTED
    const userData = await users_login_data_repository.getUserLoginData(data.email);
    if (!userData) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.user_not_exists);
    }

    // VALIDATE PASSWORD
    const validatePassword = bcryptjs.compare(data.password, userData.hashed_password);
    if (!validatePassword) {
      return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
    }

    // VERIFY IF REQUEST IS DUPLICATED
    const existedToken = await users_login_token_repository.getLoginToken(userData.user_id);

    if (existedToken && existedToken.exp > Math.floor(Date.now() / 1000)) {
      const payload = { session_id: existedToken.session_id, access_token: existedToken.access_token };
      return createResponse(res, true, payload);
    }

    // CREATE LOGIN TOKENS
    const access_token = createAccessToken({ user_id: userData.user_id, email: userData.email });
    const session_id = uuidV4();

    // GENERATE REFRESH_TOKEN IF STAYED SIGN IN
    if (data.staySignedIn) {
      const exp = Math.floor(Date.now() / 1000) + moment.duration(1, "day").asSeconds();
      const iat = Math.floor(Date.now() / 1000);

      const refreshToken = createRefreshToken({
        user_id: userData.user_id,
        email: userData.email,
        exp: exp,
        iat: iat,
      });
    
      res.cookie(String(process.env.REFRESH_COOKIE_NAME), refreshToken, {
        httpOnly: true,
        maxAge: moment.duration(1, "day").asMilliseconds(),
        sameSite: "strict",
        // Only set secure = true when communicate through https
        // secure: true,
      });

      await users_login_token_repository.addLoginToken({
        user_id: userData.user_id,
        session_id: session_id,
        access_token: access_token,
        refresh_token: refreshToken,
        exp: exp,
        iat: iat,
      });
    }

    // LOG USER ACCESS HISTORY
    const accessHistoryPayload: Omit<UsersAccessHistoryRepo, "id"> = {
      ip_address: req.ip || "::1",
      platform: getOsData(req) || "",
      user_agent: req.headers["user-agent"] || "",
      user_id: userData.user_id,
    };
    await users_access_history_repository.createAccessHistory(accessHistoryPayload);

    // RETURN
    const payload = { session_id: session_id, access_token: access_token };
    return createResponse(res, true, payload);
  } catch (error) {
    logger.error(error);
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};

// SSO
// Authenticator
