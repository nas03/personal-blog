import Home from "@/pages/user/Home/Home";
import { RouteObject } from "react-router-dom";

const appRoutes: RouteObject[] = [
  {
    path: "/home",
    Component: Home,
  },
];

export default appRoutes;
