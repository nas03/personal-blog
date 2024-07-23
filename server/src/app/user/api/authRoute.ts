//Library
import { Router } from "express";
//Domain functions
import auth from "@/app/user/domain/auth";
const authRouter = Router();

authRouter.post("/login", auth.login);
authRouter.post("/signup", auth.signup);
authRouter.get("/refresh", auth.refreshToken);
authRouter.delete("/login", auth.deleteAuth);
/* authRouter.get("/test", verifyToken, async (req, res) => {
  console.log(req.cookies);
  return createResponse(res, true, { cookie: JSON.stringify(req.cookies) });
});
 */
export default authRouter;
