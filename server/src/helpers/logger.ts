import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, align, json } = format;

const myFormat = combine(
	timestamp({
		format: 'YYYY-MM-DD hh:mm:ss.SSS A',
	}),
	printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
);
const logger = createLogger({
  level: "error",
  format: myFormat,
  transports: [
    new transports.File({
      filename: "log/sys.log",
      level: "error",
    }),
    new transports.Console(),
  ],
});
export default logger;
