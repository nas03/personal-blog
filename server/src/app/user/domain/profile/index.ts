import { createProfile } from "@/app/user/domain/profile/create_profile";
import { getUserProfile } from "./get_profile";
import { updateProfile } from "./update_profile";

const profile = {
  updateProfile,
  getUserProfile,
  createProfile,
};

export default profile;
