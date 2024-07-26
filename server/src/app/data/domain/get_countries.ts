import { logger } from "@/helpers";
import { m_countries } from "@/repositories";
import { createResponse, getErrorMsg } from "@/utilities";
import { Request, Response } from "express";

export const getCountries = async (req: Request, res: Response) => {
  try {
    const data = await m_countries.getCountriesData();
    return createResponse(res, true, data);
  } catch (error) {
    console.log(error);
    logger.error(error);
    const { responseCode, responseMessage } = getErrorMsg(error as Error);
    return createResponse(res, false, null, responseCode, responseMessage);
  }
};
