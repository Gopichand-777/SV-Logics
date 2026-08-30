import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Pretty-print in dev, structured JSON in production (for Better Stack ingestion)
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } }
    : undefined,

  // Base fields included in every log line
  base: {
    service: 'svlogics-api',
    env:     process.env.NODE_ENV,
  },
});

export default logger;
