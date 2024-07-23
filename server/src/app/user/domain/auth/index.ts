import { deleteAuth } from "./delete_auth";
import { login } from "./login";
import { refreshToken } from "./refresh_token";
import { signup } from "./signup";
const auth = { login, signup, refreshToken, deleteAuth };
export default auth;
