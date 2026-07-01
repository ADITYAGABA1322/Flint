import { App, ExpressReceiver } from '@slack/bolt';
import express from 'express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { registerMentionHandler } from './handlers/mention';

const MODULE = 'AppBootstrap';

const receiver = new ExpressReceiver({
  signingSecret: env.SLACK_SIGNING_SECRET,
  endpoints: { events: '/slack/events' }
});

const app = new App({
  token: env.SLACK_BOT_TOKEN,
  receiver,
  socketMode: env.SOCKET_MODE,
  appToken: env.SLACK_APP_TOKEN
});

const expressApp = receiver.app;
expressApp.use(express.json());

expressApp.get('/health', (_req, res) => {
  logger.debug(MODULE, 'Received GET /health');
  res.status(200).json({ ok: true, service: 'flint' });
});

expressApp.post('/cron/tick', async (_req, res) => {
  logger.info(MODULE, 'Received POST /cron/tick — monitor stub');
  res.status(200).json({ ok: true, note: 'monitor stub cycle' });
});

registerMentionHandler(app);

app.error(async (error) => {
  logger.error(MODULE, 'Uncaught Bolt framework error:', error);
});

(async () => {
  const port = env.PORT;
  await app.start(port);
  logger.info(MODULE, `Flint backend server running on port ${port} (SocketMode=${env.SOCKET_MODE})`);
})();

export { app, expressApp };
