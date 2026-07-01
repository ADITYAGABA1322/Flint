import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { logger } from '../utils/logger';

const MODULE = 'McpClientRuntime';

export class McpClient {
  private client: Client | null = null;
  private transport: SSEClientTransport | null = null;

  constructor(private cfg: { url: string; auth: Record<string, string> }) {}

  private async connect(): Promise<Client> {
    if (this.client) return this.client;

    logger.info(MODULE, `Connecting to MCP server at ${this.cfg.url}`);

    const headers: Record<string, string> = { ...this.cfg.auth };
    this.transport = new SSEClientTransport(new URL(this.cfg.url), {
      eventSourceInit: {
        headers,
      } as any,
    });

    this.client = new Client(
      {
        name: 'flint-agent',
        version: '0.1.0',
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(this.transport);
    logger.info(MODULE, `Connected successfully to MCP server at ${this.cfg.url}`);
    return this.client;
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    try {
      const client = await this.connect();
      logger.info(MODULE, `Calling tool "${toolName}" with args: ${JSON.stringify(args)}`);
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });
      return result;
    } catch (err) {
      logger.error(MODULE, `callTool "${toolName}" failed:`, err);
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.transport = null;
      logger.info(MODULE, `Closed connection to MCP server at ${this.cfg.url}`);
    }
  }
}
export type McpClientInstance = McpClient;
