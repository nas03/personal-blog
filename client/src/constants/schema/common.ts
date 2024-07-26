import { z } from 'zod';

const TokenSchema = z.object({
  user_id: z.string(),
  iat: z.number(),
  exp: z.number(),
});

const AccessTokenSchema = TokenSchema.extend({
  email: z.string(),
  authorization_id: z.number().optional(),
});

const RefreshTokenSchema = TokenSchema.extend({
  email: z.string(),
});

export type Token = z.infer<typeof TokenSchema>;
export type AccessToken = z.infer<typeof AccessTokenSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};
