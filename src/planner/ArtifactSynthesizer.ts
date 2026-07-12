import { chatCompletion } from '../tools/clients/nvidia';
import type { SlackContext } from '../../contracts/events';
import type { WorkspaceContext } from '../../contracts/context';
import type { EngineeringArtifact } from '../../contracts/artifact';

const SYNTHESIS_SYSTEM_PROMPT = `You are Flint's Principal Engineering Synthesizer, combining the capabilities of:
- Solutions Architect & Senior Software Engineer (observed vs expected behavior, technical root causes, probable codebase spots)
- Technical Product Manager (customer/business impact, executive summary)
- QA Lead (test cases, verification guidelines, acceptance criteria)
- Engineering Manager (suggested severity, priority, ownership/label tags)

Your goal is to write a comprehensive, self-contained Engineering Artifact JSON representing the issue. You MUST intentionally generate distinct, platform-specific content tailored to each target system.

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
  "acceptanceCriteria": ["Ensure checkout resolves successfully under high traffic", "Database pool max usage stays below 85%"],
  
  "linear": {
    "title": "Short engineering-focused title (e.g., '[iOS] Payment Gateway 500 Failure')",
    "conciseSummary": "Brief technical summary of the bug",
    "severity": "Severity assessment (High/Medium/Low or P0-P3)",
    "reproduction": "Step-by-step reproduction instructions based on reports",
    "impact": "Concrete technical/system impact",
    "acceptanceCriteria": ["List of specific developer verification checks"]
  },
  "notion": {
    "title": "Documentation-style descriptive title (e.g., 'Investigation and Remediation: iOS Payment Gateway Errors')",
    "background": "Historical context or system background regarding this area",
    "investigation": "How an engineer should investigate this issue, log locations to look at",
    "observations": "Summary of observations and clues from the Slack signals",
    "technicalAnalysis": "Deep technical analysis and probable code components",
    "implementationIdeas": "Suggestions for resolving the issue structurally",
    "references": "References to Slack threads, other systems, or relevant documentation",
    "timeline": "Estimated recovery/remediation timeline stages"
  },
  "asana": {
    "title": "Actionable task title with clear imperative verb (e.g., 'Fix the Payment Gateway API Error on iOS')",
    "checklist": ["Actionable subtasks or steps to complete the task"],
    "ownerPlaceholders": "Suggested role or assignee placeholder (e.g., Backend Dev, QA Tester)",
    "milestones": "Milestones for this task (e.g., fix implemented, staging verified, prod release)",
    "dependencies": "Dependencies on other tasks or systems if any",
    "dueSuggestion": "Suggested due timeline recommendation (e.g., 'Within 24 hours', 'Next Sprint')"
  }
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
        relatedIssues: workspaceCtx.similarIssues || [],
        linear: parsed.linear ? {
          title: parsed.linear.title || parsed.title || ctx.text.substring(0, 80),
          conciseSummary: parsed.linear.conciseSummary || parsed.executiveSummary || 'None.',
          severity: parsed.linear.severity || parsed.priority || 'P3',
          reproduction: parsed.linear.reproduction || 'Not specified.',
          impact: parsed.linear.impact || parsed.businessImpact || 'Not specified.',
          acceptanceCriteria: Array.isArray(parsed.linear.acceptanceCriteria) ? parsed.linear.acceptanceCriteria : (parsed.acceptanceCriteria || [])
        } : undefined,
        notion: parsed.notion ? {
          title: parsed.notion.title || parsed.title || ctx.text.substring(0, 80),
          background: parsed.notion.background || 'Not specified.',
          investigation: parsed.notion.investigation || 'Not specified.',
          observations: parsed.notion.observations || parsed.observedBehavior || 'Not specified.',
          technicalAnalysis: parsed.notion.technicalAnalysis || parsed.technicalAnalysis || 'No analysis available.',
          implementationIdeas: parsed.notion.implementationIdeas || 'Not specified.',
          references: parsed.notion.references || 'Not specified.',
          timeline: parsed.notion.timeline || 'Not specified.'
        } : undefined,
        asana: parsed.asana ? {
          title: parsed.asana.title || parsed.title || ctx.text.substring(0, 80),
          checklist: Array.isArray(parsed.asana.checklist) ? parsed.asana.checklist : (parsed.acceptanceCriteria || []),
          ownerPlaceholders: parsed.asana.ownerPlaceholders || 'Assignee',
          milestones: parsed.asana.milestones || 'Milestones',
          dependencies: parsed.asana.dependencies || 'None',
          dueSuggestion: parsed.asana.dueSuggestion || 'Not specified.'
        } : undefined
      };
    }
  } catch (err) {
    console.error('[ArtifactSynthesizer] Failed to synthesize artifact via LLM:', err);
  }

  // Fallback if anything goes wrong
  const defaultTitle = ctx.text.substring(0, 80);
  const defaultDesc = 'Slack conversation sync (fallback generation).';
  return {
    title: defaultTitle,
    executiveSummary: defaultDesc,
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
    relatedIssues: workspaceCtx.similarIssues || [],
    linear: {
      title: defaultTitle,
      conciseSummary: defaultDesc,
      severity: 'P3',
      reproduction: 'Verify Slack logs.',
      impact: 'Not specified.',
      acceptanceCriteria: ['Verify resolution with reporter.']
    },
    notion: {
      title: defaultTitle,
      background: 'Slack sync.',
      investigation: 'Verify Slack logs.',
      observations: ctx.text,
      technicalAnalysis: 'No automated analysis available.',
      implementationIdeas: 'Not specified.',
      references: 'Slack.',
      timeline: 'Not specified.'
    },
    asana: {
      title: defaultTitle,
      checklist: ['Verify resolution with reporter.'],
      ownerPlaceholders: 'Assignee',
      milestones: 'Release',
      dependencies: 'None',
      dueSuggestion: 'Next sprint'
    }
  };
}
