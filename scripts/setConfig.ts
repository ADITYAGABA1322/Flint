import { redis } from '../src/tools/clients/redis';
import { getWorkspaceConfig } from '../src/config/WorkspaceConfigStore';

(async () => {
  const channelId = process.argv[2];
  if (!channelId) {
    console.error('Usage: npx ts-node scripts/setConfig.ts <CHANNEL_ID> [WORKSPACE_ID]');
    process.exit(1);
  }
  const workspaceId = process.argv[3] || 'T0123ABC';

  const config = await getWorkspaceConfig(workspaceId);
  config.watchedChannels = [channelId];
  config.escalationChannel = channelId;

  await redis.set(`workspace:config:${workspaceId}`, config);
  console.log(`Successfully updated config for workspace "${workspaceId}" in Redis:`);
  console.log(`- watchedChannels: ${JSON.stringify(config.watchedChannels)}`);
  console.log(`- escalationChannel: "${config.escalationChannel}"`);
  process.exit(0);
})();
