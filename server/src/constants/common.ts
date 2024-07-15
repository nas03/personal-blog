import { logger } from "@/helpers";

export class ErrorLog extends Error {
  public code: number;
  constructor(code: number, message: string) {
    logger.error(`${code} - message: ${message}`);
    super(message);
    this.code = code;
  }
}
