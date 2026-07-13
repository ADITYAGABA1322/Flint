import { WebClient } from '@slack/web-api';
import { env } from '../../config/env';

export const userClient = new WebClient(env.SLACK_USER_TOKEN);
