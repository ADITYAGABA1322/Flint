export const logger = {
  info: (module: string, message: string, ...args: any[]): void => {
    console.log(`[${module}] [INFO] ${message}`, ...args);
  },
  warn: (module: string, message: string, ...args: any[]): void => {
    console.warn(`[${module}] [WARN] ${message}`, ...args);
  },
  error: (module: string, message: string, ...args: any[]): void => {
    console.error(`[${module}] [ERROR] ${message}`, ...args);
  },
  debug: (module: string, message: string, ...args: any[]): void => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${module}] [DEBUG] ${message}`, ...args);
    }
  }
};
export type Logger = typeof logger;
