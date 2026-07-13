import { Planner } from '../src/planner/Planner';
import { getWorkspaceConfig } from '../src/config/WorkspaceConfigStore';
import { executeWorkflow } from '../src/orchestration/WorkflowOrchestrator';
import '../src/tools/mcp/LinearClient';
import '../src/tools/mcp/NotionClient';
import '../src/tools/mcp/AsanaClient';

(async () => {
  console.log('--- Flint Workflow Synthesis & Enrichment Tester ---');

  const config = await getWorkspaceConfig('T0123ABC');
  
  const intent = {
    intent: 'CREATE_TICKET' as const,
    confidence: 1.0,
    entities: {
      title: 'Checkout page failed with 500 error',
      description: 'The checkout page throws 500 error on checkout under high load.',
      severity: 'P1' as const,
      toolTargets: config.connectedTools
    },
    reasoning: 'Proactive creation from sandbox'
  };

  const ctx = {
    workspaceId: 'T0123ABC',
    channelId: 'C12345',
    userId: 'U12345',
    messageTs: '1712345678.000100',
    text: 'Checkout page failed with 500 error on iOS app under high load',
    triggerType: 'action' as const,
    rawEvent: {}
  };

  const planner = new Planner();
  console.log('Running Planner.plan with SlackContext (Stage 2 Enrichener)...');
  const plan = await planner.plan(intent, config, ctx);

  console.log('\n--- GENERATED PLAN STEPS ---');
  plan.steps.forEach((step, i) => {
    console.log(`\n[Step ${i + 1}] Server: "${step.server}" -> Tool: "${step.tool}"`);
    console.log(`- Title: "${step.params.title || step.params.name || 'N/A'}"`);
    console.log(`- Priority: "${step.params.priority || 'N/A'}"`);
    const descText = (step.params.description || step.params.content || step.params.notes) as string;
    console.log(`- Description Snippet (first 400 chars):\n${descText ? descText.substring(0, 400) : 'N/A'}...\n`);
  });

  console.log('\nExecuting Plan...');
  const outcomes = await executeWorkflow(plan);
  console.log('\n--- EXECUTION SUMMARY ---');
  console.log(outcomes.summary);
})();
