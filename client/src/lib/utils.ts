import { type ClassValue, clsx } from 'clsx';
import { default as _ } from 'lodash';
import { twMerge } from 'tailwind-merge';
import { ZodSchema, z } from 'zod';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const zodValidate = <T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  schema: ZodSchema<T>,
  options?: Partial<z.ParseParams>,
): T => {
  const validate = _.isEmpty(options) ? schema.safeParse(data) : schema.safeParse(data, options);
  if (!validate.success) {
    throw new Error(validate.error.issues[0].message);
  }
  return validate.data;
};
