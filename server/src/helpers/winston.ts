import winston, { createLogger } from 'winston';

const logger = createLogger({
	level: 'error',
	transports: [
		new winston.transports.File({
			filename: 'sys.log',
			level: 'error',
		}),
	],
});
export default logger;