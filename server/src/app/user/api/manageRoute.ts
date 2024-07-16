//Library
import { Router } from "express";
//Domain functions
import manage from "@/app/user/domain/manage";
import { verifyToken } from "@/middlewares/auth";
const profileRouter = Router();

profileRouter.get("/all-users", verifyToken, manage.getAllUser);
profileRouter.post("/delete/:user_id", verifyToken, manage.deleteUser);
export default profileRouter;
