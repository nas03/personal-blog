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
export type RefreshToken = {
	id: number,
	user_id: string,
	refresh_token: string,
	iat: number;
	exp: number;
	ts_updated: number
	ts_registered: number
}