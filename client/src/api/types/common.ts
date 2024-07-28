export type IResponseMessage = {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | undefined;
  data: boolean | number | string | object | null;
};

export type IAccessTokenPayload = {
  user_id: string;
  email: string;
  iat: number;
  exp: number;
};
