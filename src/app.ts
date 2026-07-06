import { App, ExpressReceiver } from '@slack/bolt';
import express from 'express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { registerMentionHandler } from './handlers/mention';
import { registerMessageHandler, registerActionHandlers } from './handlers/message';

// Load tool runners to register them in ClientRegistry
import './tools/mcp/LinearClient';
import './tools/mcp/NotionClient';
import './tools/mcp/AsanaClient';

const MODULE = 'AppBootstrap';

let app: App;
let expressApp: express.Application;

if (env.SOCKET_MODE) {
  app = new App({
    token: env.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: env.SLACK_APP_TOKEN
  });
  expressApp = express();
} else {
  const receiver = new ExpressReceiver({
    signingSecret: env.SLACK_SIGNING_SECRET,
    endpoints: { events: '/slack/events' }
  });
  app = new App({
    token: env.SLACK_BOT_TOKEN,
    receiver
  });
  expressApp = receiver.app;
}

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
registerMessageHandler(app);
logger.info(MODULE, 'Message handler registered');
logger.info(MODULE, 'Passive observation enabled');
registerActionHandlers(app);

app.error(async (error) => {
  logger.error(MODULE, 'Uncaught Bolt framework error:', error);
});

(async () => {
  const port = env.PORT;
  if (env.SOCKET_MODE) {
    await app.start();
    expressApp.listen(port, () => {
      logger.info(MODULE, `Flint Express server listening on port ${port}`);
    });
    logger.info(MODULE, `Flint SocketMode app started successfully`);
    logger.info(MODULE, 'Socket Mode connected');
  } else {
    await app.start(port);
    logger.info(MODULE, `Flint backend server running on port ${port} (SocketMode=false)`);
  }
})();

export { app, expressApp };
