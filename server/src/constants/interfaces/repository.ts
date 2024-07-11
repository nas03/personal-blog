import { Token } from "./common";

interface Repository {
  ts_updated?: Date;
  ts_registered?: Date;
}
export interface UserBasicData extends Repository {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  hashed_password: string;
  authorization_id: number;
}

export interface UserProfile extends Repository {
  id: number;
  user_id: string;
  profile_image_url: string;
  country: string;
  address: string;
}

export interface Comment extends Repository {
  comment_id: number;
  post_id: number;
  user_id: string;
  comment: string;
}

export interface Category extends Repository {
  category_id: number;
  title: string;
  description: string;
}
export interface Post extends Repository {
  post_id: number;
  user_id: string;
  thumbnail_url: string;
  title: string;
  content: string;
}

export interface UserAccessHistory extends Repository {
  id: number;
  user_id: string;
  user_agent: string;
  ip_address: string;
}
export interface UserRefreshToken extends Token, Repository {
  id: number;
  user_id: string;
  refresh_token: string;
}
