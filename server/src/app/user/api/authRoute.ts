//Library
import { Router } from "express";
//Domain functions
import { login } from "@/app/user/domain";

const authRouter = Router();

authRouter.post("/login", login.login);
export default authRouter;
