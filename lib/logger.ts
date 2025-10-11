import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Define log transports based on environment
const transports = [
  // Console output (always enabled)
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), format),
  }),
];

// Add file logging in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.uncolorize(), format),
    }),
    // Combined logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(winston.format.uncolorize(), format),
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
});

// Helper functions for common logging patterns
export const logAIRequest = (model: string, operation: string, metadata?: unknown) => {
  logger.info('AI Request', {
    model,
    operation,
    ...metadata,
  });
};

export const logAIResponse = (
  model: string,
  operation: string,
  duration: number,
  metadata?: unknown
) => {
  logger.info('AI Response', {
    model,
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

export const logDatabaseOperation = (operation: string, collection: string, metadata?: unknown) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    ...metadata,
  });
};

export const logCacheHit = (key: string, metadata?: unknown) => {
  logger.debug('Cache Hit', {
    key,
    ...metadata,
  });
};

export const logCacheMiss = (key: string, metadata?: unknown) => {
  logger.debug('Cache Miss', {
    key,
    ...metadata,
  });
};

export const logError = (error: unknown, context?: string) => {
  if (error instanceof Error) {
    logger.error('Error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  } else {
    logger.error('Error', {
      error: String(error),
      context,
    });
  }
};

export default logger;
