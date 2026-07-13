import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { run } from '../src/tools/mcp/NotionClient';
import { env } from '../src/config/env';

describe('NotionClient Tool Runner', () => {
  const originalEnv = { ...process.env };
  const originalNotionKey = env.NOTION_API_KEY;
  const originalNotionDbId = env.NOTION_DATABASE_ID;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    env.NOTION_API_KEY = originalNotionKey;
    env.NOTION_DATABASE_ID = originalNotionDbId;
  });

  it('should run in mock fallback mode if credentials are not configured', async () => {
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_DATABASE_ID;
    env.NOTION_API_KEY = undefined;
    env.NOTION_DATABASE_ID = undefined;

    const result = await run({
      server: 'notion',
      tool: 'create_page',
      params: {
        title: 'Mock Page Title',
        content: 'Mock content body'
      }
    });

    expect(result.ok).toBe(true);
    expect(result.description).toContain('[Mock]');
    expect(result.url).toBe('https://notion.so/mock-page-id');
  });

  it('should create a Notion page via API if credentials are present', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_DATABASE_ID = 'test-db-id';
    env.NOTION_API_KEY = 'test-api-key';
    env.NOTION_DATABASE_ID = 'test-db-id';

    const mockResponse = {
      ok: true,
      json: async () => ({
        url: 'https://notion.so/test-real-page-id'
      })
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const result = await run({
      server: 'notion',
      tool: 'create_page',
      params: {
        title: 'Sprint 3 Testing Page',
        content: 'Testing page content'
      }
    });

    expect(fetchSpy).toHaveBeenCalledWith('https://api.notion.com/v1/pages', expect.any(Object));
    expect(result.ok).toBe(true);
    expect(result.description).toContain('Successfully created Notion page');
    expect(result.url).toBe('https://notion.so/test-real-page-id');
  });

  it('should handle API errors and return failure outcome', async () => {
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_DATABASE_ID = 'test-db-id';
    env.NOTION_API_KEY = 'test-api-key';
    env.NOTION_DATABASE_ID = 'test-db-id';

    const mockResponse = {
      ok: false,
      status: 400,
      text: async () => 'Invalid request syntax'
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const result = await run({
      server: 'notion',
      tool: 'create_page',
      params: {
        title: 'Sprint 3 Failure test',
        content: ''
      }
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.ok).toBe(false);
    expect(result.description).toContain('Notion page creation failed');
    expect(result.error).toContain('Notion API Error: 400 - Invalid request syntax');
  });
});
