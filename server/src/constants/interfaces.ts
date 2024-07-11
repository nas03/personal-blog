export type User = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  hashed_password: string;
  authorization_id: number;
  ts_updated: Date;
  ts_registered: Date;
};
export type AccessToken = {
  user_id: string;
  email: string;
  role?: string;
  iat: number;
  exp: number;
};
