import { createAdmin } from "./create_admin";
import { deleteUser } from "./delete_user";
import { listUsers } from "./list_users";

const admin = {
  deleteUser,
  listUsers,
  createAdmin,
};
export default admin;
