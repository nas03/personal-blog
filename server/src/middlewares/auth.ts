import { code, message } from "@/constants/consts";
import { AccessToken } from "@/constants/interfaces";
import { createResponse } from "@/utilities";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"] as string;
    console.log({ authHeader });
    if (!authHeader) {
      return createResponse(res, false, authHeader, code.UNAUTHORIZED, message.not_authorized);
    }
    const refresh_token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(refresh_token, String(process.env.JWT_SECRET)) as AccessToken;

    if (!decodedToken) {
      return createResponse(res, false, decodedToken, code.UNAUTHORIZED, message.not_authorized);
    }

    if (Date.now() / 1000 > decodedToken["exp"]) {
      return createResponse(res, false, decodedToken, code.UNAUTHORIZED, message.token_expired);
    }
    next();
  } catch (error) {
    console.log(error);
    return createResponse(res, false, error, code.UNAUTHORIZED);
  }
};
