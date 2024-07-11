//Library
import { Router } from "express";
//Domain functions
import { auth } from "@/app/user/domain";
import { createResponse } from "@/utilities";
import { verifyToken } from "@/middlewares/auth"; 
const authRouter = Router();

authRouter.post("/login", auth.login);
authRouter.post("/signup", auth.signup);
/* authRouter.get("/test", verifyToken, async (req, res) => {
  return createResponse(res, true);
});
 */// authRouter.post("/auth");

export default authRouter;
