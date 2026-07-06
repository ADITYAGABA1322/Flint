import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { run } from '../src/tools/mcp/AsanaClient';
import { env } from '../src/config/env';

describe('AsanaClient Tool Runner', () => {
  const originalEnv = { ...process.env };
  const originalAsanaToken = env.ASANA_ACCESS_TOKEN;
  const originalAsanaProjectId = env.ASANA_PROJECT_ID;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    env.ASANA_ACCESS_TOKEN = originalAsanaToken;
    env.ASANA_PROJECT_ID = originalAsanaProjectId;
  });

  it('should run in mock fallback mode if credentials are not configured', async () => {
    delete process.env.ASANA_ACCESS_TOKEN;
    delete process.env.ASANA_PROJECT_ID;
    env.ASANA_ACCESS_TOKEN = undefined;
    env.ASANA_PROJECT_ID = undefined;

    const result = await run({
      server: 'asana',
      tool: 'create_task',
      params: {
        name: 'Mock Task Title',
        notes: 'Mock notes body'
      }
    });

    expect(result.ok).toBe(true);
    expect(result.description).toContain('[Mock]');
    expect(result.url).toBe('https://asana.com/mock-task-id');
  });

  it('should create an Asana task via API if credentials are present', async () => {
    process.env.ASANA_ACCESS_TOKEN = 'test-access-token';
    process.env.ASANA_PROJECT_ID = 'test-project-id';
    env.ASANA_ACCESS_TOKEN = 'test-access-token';
    env.ASANA_PROJECT_ID = 'test-project-id';

    const mockResponse = {
      ok: true,
      json: async () => ({
        data: {
          gid: 'test-real-task-gid'
        }
      })
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const result = await run({
      server: 'asana',
      tool: 'create_task',
      params: {
        name: 'Sprint 3 Testing Task',
        notes: 'Testing task notes'
      }
    });

    expect(fetchSpy).toHaveBeenCalledWith('https://app.asana.com/api/1.0/tasks', expect.any(Object));
    expect(result.ok).toBe(true);
    expect(result.description).toContain('Successfully created Asana task');
    expect(result.url).toBe('https://app.asana.com/0/test-project-id/test-real-task-gid');
  });

  it('should handle API errors and return failure outcome', async () => {
    process.env.ASANA_ACCESS_TOKEN = 'test-access-token';
    process.env.ASANA_PROJECT_ID = 'test-project-id';
    env.ASANA_ACCESS_TOKEN = 'test-access-token';
    env.ASANA_PROJECT_ID = 'test-project-id';

    const mockResponse = {
      ok: false,
      status: 401,
      text: async () => 'Not Authorized'
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const result = await run({
      server: 'asana',
      tool: 'create_task',
      params: {
        name: 'Sprint 3 Failure test',
        notes: ''
      }
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.ok).toBe(false);
    expect(result.description).toContain('Asana task creation failed');
    expect(result.error).toContain('Asana API Error: 401 - Not Authorized');
  });
});
