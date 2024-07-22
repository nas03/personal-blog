import manageRouter from "./manageRoute";
import { Router } from "express";
import communityRoute from "./generalRoute";

const categoryRoute = Router();

categoryRoute.use("/category/manage", manageRouter);
categoryRoute.use("/category/community", communityRoute);
export default categoryRoute;
