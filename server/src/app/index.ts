import categoryRoute from "@/app/category/api";
import postRoute from "@/app/post/api";
import userRoute from "@/app/user/api";
import dataRoute from "./data/api";

export const route = [userRoute, postRoute, categoryRoute, dataRoute];
