import type { ToolCall, ActionResult } from '../../../contracts/services';
import type { ToolRunner } from '../../../contracts/orchestration';
import { registry } from '../../orchestration/ClientRegistry';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

const MODULE = 'NotionClient';

export const run = async (call: ToolCall): Promise<ActionResult> => {
  logger.info(MODULE, `Notion runner executing tool="${call.tool}"`);

  const notionKey = process.env.NOTION_API_KEY || (env as any).NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID || (env as any).NOTION_DATABASE_ID;

  if (!notionKey || !dbId) {
    logger.warn(MODULE, 'Notion credentials not fully configured in env. Running in mock fallback mode.');
    return {
      tool: 'notion',
      ok: true,
      description: `[Mock] Notion page logged: "${call.params.title || 'Untitled page'}"`,
      url: 'https://notion.so/mock-page-id'
    };
  }

  try {
    const title = (call.params.title as string) || 'Slack Sync Ticket';
    const content = (call.params.content as string) || '';
    const blocks = (call.params.blocks as any[]) || [];

    let children = [];
    if (blocks.length > 0) {
      children = blocks;
    } else if (content) {
      children = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: content.substring(0, 2000)
                }
              }
            ]
          }
        }
      ];
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          }
        },
        children
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    const pageUrl = data.url || 'https://notion.so';

    return {
      tool: 'notion',
      ok: true,
      description: `Successfully created Notion page: "${title}"`,
      url: pageUrl
    };
  } catch (err: any) {
    logger.error(MODULE, 'Notion integration failure:', err);
    return {
      tool: 'notion',
      ok: false,
      description: `Notion page creation failed: ${err.message || String(err)}`,
      error: err.message || String(err)
    };
  }
};

registry.register('notion', { run });
