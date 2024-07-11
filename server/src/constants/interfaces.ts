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
export interface Token {
  user_id: string;
  iat: number;
  exp: number;
}
export interface AccessToken extends Token {
  email: string;
  role?: string;
}
export interface RefreshToken extends Token {
  email: string;
}
export interface UserRefreshToken extends Token {
  id: number;
  refresh_token: string;
  ts_updated: number;
  ts_registered: number;
}
