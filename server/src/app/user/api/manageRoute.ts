//Library
import { Router } from "express";
//Domain functions
import manage from "@/app/user/domain/manage";
const manageRouter = Router();

manageRouter.get("/all-users", manage.getAllUser);
manageRouter.post("/delete/:user_id", manage.deleteUser);
export default manageRouter;
