import manageRouter from "@/app/category/api/manageRoute";
import { Router } from "express";

const categoryRoute = Router();

categoryRoute.use("/category", manageRouter);

export default categoryRoute;
