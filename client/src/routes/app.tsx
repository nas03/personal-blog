import HomePage from "@/pages/user/Home/HomePage";
import SignIn from "@/pages/user/SignIn/SignIn";
import SignUp from "@/pages/user/SignUp/SignUp";

const appRoutes = [
  {
    path: "/home",
    component: <HomePage />,
    layout: "app",
    title: "Weather Visual - Home",
  },
  {
    path: "/signin",
    component: <SignIn />,
    layout: "app",
    title: "Weather Visual - Sign In",
  },
  {
    path: "/signup",
    component: <SignUp />,
    layout: "app",
    title: "Weather Visual - Sign Up",
  },
];

export default appRoutes;
