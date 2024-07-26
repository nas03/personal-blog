import { Router } from "express";
import countryRouter from "./countryRoute";

const dataRoute = Router();
dataRoute.use("/data/country", countryRouter);
export default dataRoute;
