import type { ToolCall, ActionResult } from '../../../contracts/services';
import type { ToolRunner } from '../../../contracts/orchestration';
import { registry } from '../../orchestration/ClientRegistry';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

const MODULE = 'AsanaClient';

export const run = async (call: ToolCall): Promise<ActionResult> => {
  logger.info(MODULE, `Asana runner executing tool="${call.tool}"`);

  const asanaToken = process.env.ASANA_ACCESS_TOKEN || (env as any).ASANA_ACCESS_TOKEN;
  const projectId = process.env.ASANA_PROJECT_ID || (env as any).ASANA_PROJECT_ID;

  if (!asanaToken || !projectId) {
    logger.warn(MODULE, 'Asana credentials not fully configured in env. Running in mock fallback mode.');
    const mockTaskName = call.params.name || 'Untitled task';
    const mockSubtasksCount = Array.isArray(call.params.subtasks) ? call.params.subtasks.length : 0;
    return {
      tool: 'asana',
      ok: true,
      description: `[Mock] Asana task created: "${mockTaskName}" with ${mockSubtasksCount} subtasks.`,
      url: 'https://asana.com/mock-task-id'
    };
  }

  try {
    const name = (call.params.name as string) || 'Slack Actionable Task';
    const notes = (call.params.notes as string) || '';
    const subtasks = (call.params.subtasks as string[]) || [];

    const response = await fetch('https://app.asana.com/api/1.0/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${asanaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          name,
          notes,
          projects: [projectId]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Asana API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    const parentGid = data.data.gid;
    const taskUrl = `https://app.asana.com/0/${projectId}/${parentGid}`;

    // Create subtasks in Asana
    for (const subtaskName of subtasks) {
      try {
        const subRes = await fetch(`https://app.asana.com/api/1.0/tasks/${parentGid}/subtasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${asanaToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              name: subtaskName
            }
          })
        });
        if (!subRes.ok) {
          const subErrText = await subRes.text();
          logger.error(MODULE, `Failed to create subtask "${subtaskName}": ${subRes.status} - ${subErrText}`);
        }
      } catch (subErr) {
        logger.error(MODULE, `Error posting subtask "${subtaskName}":`, subErr);
      }
    }

    return {
      tool: 'asana',
      ok: true,
      description: `Successfully created Asana task: "${name}" with ${subtasks.length} subtasks`,
      url: taskUrl
    };
  } catch (err: any) {
    logger.error(MODULE, 'Asana integration failure:', err);
    return {
      tool: 'asana',
      ok: false,
      description: `Asana task creation failed: ${err.message || String(err)}`,
      error: err.message || String(err)
    };
  }
};

registry.register('asana', { run });
