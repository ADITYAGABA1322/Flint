import type { ToolCall, ActionResult } from '../../../contracts/services';
import { McpClient } from '../mcpRuntime';
import { env } from '../../config/env';

const linear = new McpClient({
  url: 'https://mcp.linear.app/mcp',
  auth: { Authorization: env.LINEAR_API_KEY }
});

export const run = async (call: ToolCall): Promise<ActionResult> => {
  try {
    const result = await linear.callTool(call.tool, call.params);

    const isOk = result && !result.isError;
    const textContent = Array.isArray(result.content)
      ? result.content.map((c: any) => c.text || '').join('\n')
      : String(result.text || 'Linear action complete');

    return {
      tool: 'linear',
      ok: isOk,
      description: textContent,
      url: result.url || 'https://linear.app'
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
