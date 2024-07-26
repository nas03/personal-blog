import domain from "@/app/data/domain";
import { Router } from "express";
const countryRouter = Router();

countryRouter.get("/all", domain.getCountries);

export default countryRouter;
