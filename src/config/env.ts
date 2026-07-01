import dotenv from 'dotenv';
dotenv.config();

export interface Env {
  SLACK_BOT_TOKEN: string;
  SLACK_SIGNING_SECRET: string;
  SLACK_APP_TOKEN?: string;
  SLACK_USER_TOKEN: string;
  ANTHROPIC_API_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  LINEAR_API_KEY: string;
  PORT: number;
  SOCKET_MODE: boolean;
}

const requiredKeys: Array<keyof Env> = [
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'SLACK_USER_TOKEN',
  'ANTHROPIC_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'LINEAR_API_KEY',
];

function validateEnv(): Env {
  const processEnv = process.env;
  const missing: string[] = [];

  for (const key of requiredKeys) {
    if (!processEnv[key]) {
      missing.push(key);
    }
  }

  const socketMode = processEnv.SOCKET_MODE === 'true';
  if (socketMode && !processEnv.SLACK_APP_TOKEN) {
    missing.push('SLACK_APP_TOKEN (required when SOCKET_MODE is true)');
  }

  if (missing.length > 0) {
    throw new Error(`[Config] Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    SLACK_BOT_TOKEN: processEnv.SLACK_BOT_TOKEN!,
    SLACK_SIGNING_SECRET: processEnv.SLACK_SIGNING_SECRET!,
    SLACK_APP_TOKEN: processEnv.SLACK_APP_TOKEN,
    SLACK_USER_TOKEN: processEnv.SLACK_USER_TOKEN!,
    ANTHROPIC_API_KEY: processEnv.ANTHROPIC_API_KEY!,
    UPSTASH_REDIS_REST_URL: processEnv.UPSTASH_REDIS_REST_URL!,
    UPSTASH_REDIS_REST_TOKEN: processEnv.UPSTASH_REDIS_REST_TOKEN!,
    LINEAR_API_KEY: processEnv.LINEAR_API_KEY!,
    PORT: processEnv.PORT ? parseInt(processEnv.PORT, 10) : 3000,
    SOCKET_MODE: socketMode,
  };
}

export const env = validateEnv();
