export interface Token {
  user_id: string;
  iat: number;
  exp: number;
}
export interface AccessToken extends Token {
  email: string;
  authorization_id?: number;
}
export interface RefreshToken extends Token {
  email: string;
}
