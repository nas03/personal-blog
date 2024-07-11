import { code, message } from "@/constants/consts";
import { AccessToken } from "@/constants/interfaces";
import { createResponse } from "@/utilities";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
  }
  const decodedToken = jwt.verify(authHeader, String(process.env.JWT_SECRET_KEY)) as AccessToken;
  if (!decodedToken) {
    return createResponse(res, false, null, code.UNAUTHORIZED, message.not_authorized);
  }

  if (Date.now() > decodedToken.exp) {
    return createResponse(res, false, null, code.UNAUTHORIZED);
  }
  next();
};
