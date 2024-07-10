import jwt from "jsonwebtoken";
import { Request, Response, Application, Router } from "express";

export const createResponse = (res: Response, isSuccess: boolean, data?: any, code: number = 500, message: string = "") => {
  if (isSuccess) {
    return res.status(200).json({
      status: "success",
      data: data,
      message: message,
    });
  }

  return res.status(code).json({
    status: "error",
    data: data,
    message: message,
  });
};

export const createAccessToken = (payload: { user_id: string; email: string; role?: string }) => {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
    },
    `${process.env.JWT_SECRET_KEY}`,
    {
      algorithm: "ES256",
      expiresIn: `${process.env.JWT_ACCESS_EXP}`,
    },
  );
};

export const validateFields = (data: any, fields: string[]) => {
  for (let field of fields) {
    if (!data[field]) {
      return false;
    }
  }

  return true;
};
