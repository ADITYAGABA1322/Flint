import type { EngineeringArtifact } from '../../contracts/artifact';

export function renderAsana(artifact: EngineeringArtifact): { name: string; notes: string; subtasks: string[] } {
  const notes = [
    `EXECUTIVE SUMMARY:`,
    artifact.executiveSummary || 'None.',
    ``,
    `BUSINESS IMPACT:`,
    artifact.businessImpact || 'Not specified.',
    ``,
    `TECHNICAL NOTES (AI-Generated):`,
    artifact.technicalAnalysis || 'None.',
    ``,
    `EVIDENCE:`,
    `- Slack Thread: ${artifact.evidence.slackUrl || 'Unavailable'}`,
    `- Reporter: ${artifact.evidence.reporter || 'unknown'}`,
    `- Channel: ${artifact.evidence.channel || 'unknown'}`,
    `- Timestamp: ${artifact.evidence.timestamp || 'Unavailable'}`,
    ``,
    `Check the subtasks list for details on acceptance criteria and verification steps.`
  ].join('\n');

  // Generate subtasks from acceptance criteria
  const subtasks = [...(artifact.acceptanceCriteria || [])];
  if (subtasks.length === 0) {
    subtasks.push('Verify resolution with reporter.');
  }

  return {
    name: artifact.title,
    notes,
    subtasks
  };
}
