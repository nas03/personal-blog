//Library
import { Router } from "express";
//Domain functions
import manage from "@/app/user/domain/manage";
import { verifyToken } from "@/middlewares/auth";
const manageRouter = Router();

manageRouter.get("/all-users", verifyToken, manage.getAllUser);
manageRouter.post("/delete/:user_id", verifyToken, manage.deleteUser);
export default manageRouter;
