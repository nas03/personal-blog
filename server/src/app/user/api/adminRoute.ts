import admin from "@/app/user/domain/admin";
import { Router } from "express";
const adminRouter = Router();

adminRouter.delete("/delete/:user_id", admin.deleteUser);
adminRouter.get("/list-users", admin.listUsers);
adminRouter.post("/create-admin", admin.createAdmin);
export default adminRouter;
