import dotenv from 'dotenv';
dotenv.config();

export interface Env {
  SLACK_BOT_TOKEN: string;
  SLACK_SIGNING_SECRET: string;
  SLACK_APP_TOKEN?: string;
  SLACK_USER_TOKEN: string;
  NVIDIA_API_KEY: string;
  NVIDIA_API_URL: string;
  NVIDIA_API_MODEL: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  LINEAR_API_KEY: string;
  LINEAR_DEFAULT_TEAM?: string;
  PORT: number;
  SOCKET_MODE: boolean;
  NOTION_API_KEY?: string;
  NOTION_DATABASE_ID?: string;
  ASANA_ACCESS_TOKEN?: string;
  ASANA_PROJECT_ID?: string;
}

const requiredKeys: Array<keyof Env> = [
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'SLACK_USER_TOKEN',
  'NVIDIA_API_KEY',
  'NVIDIA_API_URL',
  'NVIDIA_API_MODEL',
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
    NVIDIA_API_KEY: processEnv.NVIDIA_API_KEY!,
    NVIDIA_API_URL: processEnv.NVIDIA_API_URL!,
    NVIDIA_API_MODEL: processEnv.NVIDIA_API_MODEL!,
    UPSTASH_REDIS_REST_URL: processEnv.UPSTASH_REDIS_REST_URL!,
    UPSTASH_REDIS_REST_TOKEN: processEnv.UPSTASH_REDIS_REST_TOKEN!,
    LINEAR_API_KEY: processEnv.LINEAR_API_KEY!,
    LINEAR_DEFAULT_TEAM: processEnv.LINEAR_DEFAULT_TEAM,
    PORT: processEnv.PORT ? parseInt(processEnv.PORT, 10) : 3000,
    SOCKET_MODE: socketMode,
    NOTION_API_KEY: processEnv.NOTION_API_KEY,
    NOTION_DATABASE_ID: processEnv.NOTION_DATABASE_ID,
    ASANA_ACCESS_TOKEN: processEnv.ASANA_ACCESS_TOKEN,
    ASANA_PROJECT_ID: processEnv.ASANA_PROJECT_ID,
  };
}

export const env = validateEnv();
