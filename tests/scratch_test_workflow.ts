import { executeWorkflow } from '../src/orchestration/WorkflowOrchestrator';
import '../src/orchestration/ClientRegistry';
import '../src/tools/mcp/LinearClient';
import '../src/tools/mcp/NotionClient';
import '../src/tools/mcp/AsanaClient';

(async () => {
  console.log('--- Flint Workflow Orchestration Runner ---');
  
  const plan = {
    steps: [
      {
        server: 'linear',
        tool: 'create_issue',
        params: {
          title: 'Flint Integration Sandbox Bug',
          description: 'This is a testing issue created concurrently by the Flint workflow engine.',
          priority: 'P2'
        }
      },
      {
        server: 'notion',
        tool: 'create_page',
        params: {
          title: 'Flint Integration Sandbox Bug Doc',
          content: 'This documentation page was created in parallel by the Flint workflow orchestrator.'
        }
      },
      {
        server: 'asana',
        tool: 'create_task',
        params: {
          name: 'Flint Integration Sandbox Task',
          notes: 'This Asana task was synchronized by the Flint workflow engine.'
        }
      }
    ]
  };

  console.log(`Executing plan with ${plan.steps.length} parallel steps...`);
  const outcomes = await executeWorkflow(plan);

  console.log('\n--- EXECUTION OUTCOMES ---');
  console.log(outcomes.summary);
  console.log('\nDetailed Results:');
  outcomes.results.forEach((res, i) => {
    console.log(`\n[Step ${i + 1}] Server: "${res.tool}"`);
    console.log(`- Status: ${res.ok ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`- Description: ${res.description}`);
    console.log(`- URL: ${res.url || 'N/A'}`);
    if (res.error) {
      console.log(`- Error details: ${res.error}`);
    }
  });
})();
