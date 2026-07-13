import { userClient } from '../tools/clients/slack';
import { run as runLinear } from '../tools/mcp/LinearClient';
import { redis } from '../tools/clients/redis';
import { md5 } from '../utils/hashing';
import { jaccardSimilarity } from '../planner/SimilarityEngine';
import type { WorkspaceConfig } from '../../contracts/services';
import type { ToolIssueMatch, HistoricalThread, WorkspaceContext } from '../../contracts/context';
import type { SlackContext } from '../../contracts/events';
import { logger } from '../utils/logger';

const MODULE = 'ContextEngine';

export async function gatherContext(
  ctx: SlackContext,
  config: WorkspaceConfig
): Promise<WorkspaceContext> {
  const triggerMessage = ctx.text;
  const messageHash = md5(triggerMessage);
  const suggestKey = `workspace:suggested:${ctx.channelId}:${messageHash}`;

  console.log(`[ContextEngine] gatherContext triggered for message: "${triggerMessage}"`);

  let isAlreadySuggested = false;
  try {
    const cached = await redis.get(suggestKey);
    if (cached) {
      isAlreadySuggested = true;
      console.log(`[ContextEngine] Cache hit: message was already suggested recently (key=${suggestKey})`);
    } else {
      console.log(`[ContextEngine] Cache miss: message not suggested recently (key=${suggestKey})`);
    }
  } catch (err) {
    logger.warn(MODULE, 'Failed to query Redis cache, proceeding with cache miss', err);
  }

  // 1. Slack RTS - Search messages across workspace
  let similarThreads: HistoricalThread[] = [];
  if (triggerMessage.length > 3) {
    try {
      const cleanQuery = triggerMessage.replace(/[^a-z0-9\s]/gi, ' ').trim();
      if (cleanQuery) {
        console.log(`[ContextEngine] Executing Slack RTS cross-channel search for: "${cleanQuery}"`);
        const searchRes = await userClient.search.messages({
          query: cleanQuery,
          count: 5
        } as any);
        const matches = (searchRes as any).messages?.matches || [];
        console.log(`[ContextEngine] Slack RTS returned ${matches.length} matching threads.`);
        similarThreads = matches.map((m: any) => ({
          permalink: m.permalink || '#',
          text: m.text || '',
          user: m.username || m.user || 'unknown',
          timestamp: m.ts || '',
          channel: m.channel?.name || m.channel?.id || 'unknown'
        }));
      }
    } catch (err) {
      logger.warn(MODULE, 'Slack RTS search query failed, proceeding with empty threads context', err);
    }
  }

  // 2. Linear MCP - Query issue catalog
  let similarIssues: ToolIssueMatch[] = [];
  try {
    console.log('[ContextEngine] Calling Linear MCP save_issue/list_issues tool...');
    const mcpRes = await runLinear({
      server: 'linear',
      tool: 'list_issues',
      params: {}
    });

    console.log(`[ContextEngine] Linear MCP list_issues success status: ok=${mcpRes.ok}`);

    if (mcpRes.ok && mcpRes.description) {
      try {
        const parsed = JSON.parse(mcpRes.description);
        const issuesList = Array.isArray(parsed.issues) ? parsed.issues : [];

        similarIssues = issuesList.map((issue: any) => {
          const score = jaccardSimilarity(triggerMessage, issue.title || '');
          return {
            id: issue.id || '',
            title: issue.title || '',
            status: issue.status || 'unknown',
            url: issue.url || `https://linear.app/issue/${issue.id}`,
            similarity: score
          };
        }).filter((item: ToolIssueMatch) => item.similarity > 0.15); // Match threshold

        // Sort by similarity descending
        similarIssues.sort((a, b) => b.similarity - a.similarity);
      } catch (jsonErr) {
        logger.error(MODULE, 'Failed to parse Linear issues JSON response', jsonErr);
      }
    }
  } catch (err) {
    logger.warn(MODULE, 'Failed to query Linear issues list, proceeding with empty issues context', err);
  }

  // Fetch permalink for trigger message
  let triggerPermalink: string | undefined = undefined;
  if (ctx.channelId && ctx.messageTs) {
    try {
      const permRes = await userClient.chat.getPermalink({
        channel: ctx.channelId,
        message_ts: ctx.messageTs
      });
      triggerPermalink = permRes.permalink;
    } catch (err) {
      logger.warn(MODULE, 'Failed to fetch trigger permalink', err);
    }
  }

  // 3. Deduplication Synthesis
  const highestMatch = similarIssues[0];
  const isDuplicate = highestMatch ? highestMatch.similarity > 0.45 : false;

  return {
    triggerMessage,
    similarThreads,
    similarIssues,
    isDuplicate,
    duplicateTarget: isDuplicate ? highestMatch : undefined,
    isAlreadySuggested,
    triggerPermalink
  };
}
