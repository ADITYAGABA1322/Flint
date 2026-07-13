import { vi, describe, it, expect } from 'vitest';
import { run } from '../src/tools/mcp/LinearClient';

vi.mock('../src/tools/mcpRuntime', () => {
  return {
    McpClient: class {
      async callTool(name: string, params: any) {
        if (name === 'list_teams') {
          return {
            content: [
              {
                text: JSON.stringify({
                  teams: [
                    { id: 'team-uuid-123', name: 'Mock Team' }
                  ]
                })
              }
            ]
          };
        }
        return {
          isError: false,
          content: [{ text: `Called ${name} with ${JSON.stringify(params)}` }]
        };
      }
    }
  };
});

describe('LinearClient Parameters Adapter', () => {
  it('should translate create_issue to save_issue, map priority, and resolve default team', async () => {
    const result = await run({
      server: 'linear',
      tool: 'create_issue',
      params: {
        title: 'Crash on payment gateway',
        description: 'checkout returns 500',
        priority: 'P2'
      }
    });

    expect(result.ok).toBe(true);
    expect(result.description).toContain('save_issue');
    expect(result.description).toContain('team-uuid-123');
    expect(result.description).toContain('"priority":3');
  });
});
