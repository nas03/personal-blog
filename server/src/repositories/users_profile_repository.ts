import { UserProfile } from "@/constants/interfaces";
import { db } from "@/helpers";

export const getUserProfile = async (user_id: string) => {
  const query = await db<UserProfile>("users_profile").select("id", "user_id", "profile_image_url", "address", "country").first();
  return query;
};
