//Library
import { Router } from "express";
//Domain functions
import { auth } from "@/app/user/domain";

const authRouter = Router();

authRouter.post("/login", auth.login);
authRouter.post("/signup", auth.signup);
// authRouter.post("/auth");

export default authRouter;
