// @ts-nocheck
import pino from 'pino';

export const logger = pino({
  name: 'lindiwe',
  level: process.env.LOG_LEVEL ?? 'info',
});
