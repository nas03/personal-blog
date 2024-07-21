import manage from "@/app/post/domain/manage";
import { Router } from "express";

const manageRouter = Router();

manageRouter.post("/create", manage.createPost);
manageRouter.get("/user", manage.getPostsByUserId);
manageRouter.get("/:post_id", manage.getPostById);
manageRouter.get("/author/:author_id", manage.getPostsByAuthor);
manageRouter.put("/update/:post_id", manage.updatePost);

export default manageRouter;
