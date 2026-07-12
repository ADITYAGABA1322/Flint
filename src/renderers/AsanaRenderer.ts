import type { EngineeringArtifact } from '../../contracts/artifact';
import { formatFriendlyTime } from '../utils/time';

export function renderAsana(artifact: EngineeringArtifact): { name: string; notes: string; subtasks: string[] } {
  if (artifact.asana) {
    const as = artifact.asana;
    const notes = [
      `ASANA EXECUTION PLAN:`,
      `Suggested Owner: ${as.ownerPlaceholders}`,
      `Milestones: ${as.milestones}`,
      `Dependencies: ${as.dependencies}`,
      `Timeline Recommendation: ${as.dueSuggestion}`,
      ``,
      `EVIDENCE:`,
      `- Slack Thread: ${artifact.evidence.slackUrl || 'Unavailable'}`,
      `- Reporter: ${artifact.evidence.reporter || 'unknown'}`,
      `- Timestamp: ${formatFriendlyTime(artifact.evidence.timestamp) || 'Unavailable'}`,
      ``,
      `Check subtasks below for individual execution checklist steps.`
    ].join('\n');

    return {
      name: as.title,
      notes,
      subtasks: as.checklist.length > 0 ? as.checklist : ['Verify resolution with reporter.']
    };
  }

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
    `- Timestamp: ${formatFriendlyTime(artifact.evidence.timestamp) || 'Unavailable'}`,
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
