import { createResponse, getErrorMsg, getUserIdByToken } from "@/utilities";
import { Request, Response } from "express";

const getTemperatureData = async (req: Request, res: Response) => {
    try {
        const user_id = getUserIdByToken(req);
        // const {forecast, current} = req.query;
        // const 
    } catch (error) {
        const {responseCode, responseMessage} = getErrorMsg(error as Error);
        return createResponse(res, false, null, responseCode, responseMessage)
    }
}