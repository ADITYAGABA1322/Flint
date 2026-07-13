import type { ToolCall, ActionResult } from '../../../contracts/services';
import type { ToolRunner } from '../../../contracts/orchestration';
import { McpClient } from '../mcpRuntime';
import { env } from '../../config/env';
import { registry } from '../../orchestration/ClientRegistry';

const linear = new McpClient({
  url: 'https://mcp.linear.app/mcp',
  auth: { Authorization: `Bearer ${env.LINEAR_API_KEY}` }
});

export const run = async (call: ToolCall): Promise<ActionResult> => {
  try {
    let toolName = call.tool;
    const params = { ...call.params };

    if (toolName === 'create_issue') {
      toolName = 'save_issue';
    }

    if (toolName === 'save_issue') {
      if (!params.team) {
        try {
          const teamsResult = await linear.callTool('list_teams', {});
          const text = teamsResult.content?.[0]?.text || '{}';
          const parsed = JSON.parse(text);
          const firstTeam = parsed.teams?.[0];
          if (firstTeam) {
            params.team = firstTeam.id;
          } else {
            throw new Error('No teams found in your Linear workspace.');
          }
        } catch (e) {
          throw new Error(`Failed to resolve default Linear team: ${String(e)}`);
        }
      }

      const priorityMap: Record<string, number> = {
        'P0': 1,
        'P1': 2,
        'P2': 3,
        'P3': 4
      };
      const rawPriority = params.priority as string | undefined;
      params.priority = rawPriority ? (priorityMap[rawPriority] ?? 0) : 0;
    }

    const result = await linear.callTool(toolName, params);

    const isOk = result && !result.isError;
    const textContent = Array.isArray(result.content)
      ? result.content.map((c: any) => c.text || '').join('\n')
      : String(result.text || 'Linear action complete');

    let issueDisplay = textContent;
    let url = result.url || 'https://linear.app';
    try {
      const parsed = JSON.parse(textContent);
      if (parsed.id && parsed.title) {
        issueDisplay = `${parsed.id}: ${parsed.title}`;
      }
      if (parsed.url) {
        url = parsed.url;
      }
    } catch (e) {
      // Use raw textContent if not a valid JSON structure
    }

    return {
      tool: 'linear',
      ok: isOk,
      description: issueDisplay,
      url: url
    };
  } catch (err) {
    return {
      tool: 'linear',
      ok: false,
      description: 'Linear action failed',
      error: String(err)
    };
  }
};

registry.register('linear', { run });
