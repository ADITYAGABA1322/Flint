import { chatCompletion } from '../tools/clients/nvidia';
import type { SlackContext } from '../../contracts/events';
import type { WorkspaceContext } from '../../contracts/context';
import type { EngineeringArtifact } from '../../contracts/artifact';

const SYNTHESIS_SYSTEM_PROMPT = `You are Flint's Principal Engineering Synthesizer, combining the capabilities of:
- Solutions Architect & Senior Software Engineer (observed vs expected behavior, technical root causes, probable codebase spots)
- Technical Product Manager (customer/business impact, executive summary)
- QA Lead (test cases, verification guidelines, acceptance criteria)
- Engineering Manager (suggested severity, priority, ownership/label tags)

Your goal is to write a comprehensive, self-contained Engineering Artifact JSON representing the issue. The engineer should not need to read Slack to start coding.

Format the output strictly as a JSON object matching this schema (do NOT wrap in markdown fences or HTML code blocks in the raw response):
{
  "title": "Concise, searchable engineering title (e.g. 'Fix payment gateway 500 error on iOS')",
  "executiveSummary": "High-level summary of the problem and why it matters",
  "observedBehavior": "Detailed observed behavior, error messages, and context",
  "expectedBehavior": "How the system should behave correctly under normal conditions",
  "businessImpact": "The impact on users, business, or operational performance",
  "technicalAnalysis": "Probable causes, code components involved, or structural analysis (clearly marked as AI-generated analysis)",
  "priority": "P0, P1, P2, or P3 based on urgency",
  "labels": ["bug", "checkout", "ios"],
  "acceptanceCriteria": ["Ensure checkout resolves successfully under high traffic", "Database pool max usage stays below 85%"]
}`;

export async function synthesizeArtifact(
  ctx: SlackContext,
  workspaceCtx: WorkspaceContext
): Promise<EngineeringArtifact> {
  const threadsText = workspaceCtx.similarThreads && workspaceCtx.similarThreads.length > 0
    ? workspaceCtx.similarThreads.map((t: any) => `- [User: ${t.user} in #${t.channel} at ${t.timestamp}]: "${t.text}"`).join('\n')
    : 'None';

  const issuesText = workspaceCtx.similarIssues && workspaceCtx.similarIssues.length > 0
    ? workspaceCtx.similarIssues.map((i: any) => `- [${i.id}] "${i.title}" (Status: ${i.status}, Similarity: ${Math.round(i.similarity * 100)}%)`).join('\n')
    : 'None';

  const promptPayload = [
    `Trigger Slack Message: "${ctx.text}"`,
    `Reporter User ID: ${ctx.userId}`,
    `Channel ID: ${ctx.channelId}`,
    `Timestamp: ${ctx.messageTs || 'unknown'}`,
    `Trigger Permalink: ${workspaceCtx.triggerPermalink || 'unknown'}`,
    `\nWorkspace Context (Similar Slack History):\n${threadsText}`,
    `\nWorkspace Context (Similar issues catalogue):\n${issuesText}`,
  ].join('\n');

  try {
    const rawResult = await chatCompletion(
      [{ role: 'user', content: promptPayload }],
      SYNTHESIS_SYSTEM_PROMPT
    );

    let parsed: any = null;
    try {
      const cleaned = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[ArtifactSynthesizer] JSON parsing error:', parseErr, '\nRaw output was:', rawResult);
    }

    if (parsed) {
      return {
        title: parsed.title || ctx.text.substring(0, 80),
        executiveSummary: parsed.executiveSummary || parsed.summary || 'None.',
        observedBehavior: parsed.observedBehavior || ctx.text,
        expectedBehavior: parsed.expectedBehavior || 'Not specified.',
        businessImpact: parsed.businessImpact || 'Not specified.',
        technicalAnalysis: parsed.technicalAnalysis || parsed.aiAnalysis || 'No analysis available.',
        priority: parsed.priority || 'P3',
        labels: Array.isArray(parsed.labels) ? parsed.labels : (typeof parsed.labels === 'string' ? parsed.labels.split(',').map((s: string) => s.trim()) : []),
        evidence: {
          slackUrl: workspaceCtx.triggerPermalink,
          reporter: ctx.userId || 'unknown',
          channel: ctx.channelId || 'unknown',
          timestamp: ctx.messageTs || String(new Date().getTime() / 1000)
        },
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria) ? parsed.acceptanceCriteria : (typeof parsed.acceptanceCriteria === 'string' ? [parsed.acceptanceCriteria] : []),
        relatedIssues: workspaceCtx.similarIssues || []
      };
    }
  } catch (err) {
    console.error('[ArtifactSynthesizer] Failed to synthesize artifact via LLM:', err);
  }

  // Fallback if anything goes wrong
  return {
    title: ctx.text.substring(0, 80),
    executiveSummary: 'Slack conversation sync (fallback generation).',
    observedBehavior: ctx.text,
    expectedBehavior: 'Not specified.',
    businessImpact: 'Not specified.',
    technicalAnalysis: 'No automated analysis available (fallback mode).',
    priority: 'P3',
    labels: [],
    evidence: {
      slackUrl: workspaceCtx.triggerPermalink,
      reporter: ctx.userId || 'unknown',
      channel: ctx.channelId || 'unknown',
      timestamp: ctx.messageTs || String(new Date().getTime() / 1000)
    },
    acceptanceCriteria: ['Verify resolution with reporter.'],
    relatedIssues: workspaceCtx.similarIssues || []
  };
}
