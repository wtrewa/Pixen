import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const logsDir = path.resolve(process.cwd(), 'logs');

/**
 * Determine whether the logs directory exists (or can be created) and is
 * writable. This prevents the application from crashing on startup in
 * environments where the filesystem is read-only or permissions are
 * misconfigured (e.g. certain container runtimes).
 */
function canWriteLogs(): boolean {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.accessSync(logsDir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

const fileTransports: winston.transport[] = canWriteLogs()
  ? [
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
        handleExceptions: false,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: combine(timestamp(), winston.format.json()),
        handleExceptions: false,
      }),
    ]
  : [];

if (fileTransports.length === 0) {
  // eslint-disable-next-line no-console
  console.warn(
    `[winston] "${logsDir}" is not writable, falling back to console-only logging.`,
  );
}

export const winstonConfig: winston.LoggerOptions = {
  level: process.env.APP_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [new winston.transports.Console(), ...fileTransports],
  exitOnError: false,
};
