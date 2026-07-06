import type { EngineeringArtifact } from '../../contracts/artifact';

export function renderLinear(artifact: EngineeringArtifact): { title: string; description: string; priority: string } {
  const labelsText = artifact.labels && artifact.labels.length > 0 ? artifact.labels.join(', ') : 'None';
  
  let duplicateIssuesText = 'No related duplicates found.';
  if (artifact.relatedIssues && artifact.relatedIssues.length > 0) {
    duplicateIssuesText = artifact.relatedIssues
      .map((i) => `* [${i.id}](${i.url}) - ${i.title} (Status: ${i.status})`)
      .join('\n');
  }

  const description = [
    `## Executive Summary`,
    artifact.executiveSummary || 'None.',
    ``,
    `## Details`,
    `* **Observed Behavior:** ${artifact.observedBehavior || 'Not specified.'}`,
    `* **Expected Behavior:** ${artifact.expectedBehavior || 'Not specified.'}`,
    `* **Business Impact:** ${artifact.businessImpact || 'Not specified.'}`,
    ``,
    `## Evidence`,
    `* **Slack Thread:** ${artifact.evidence.slackUrl || 'Unavailable'}`,
    `* **Reporter:** <@${artifact.evidence.reporter || 'unknown'}>`,
    `* **Channel:** <#${artifact.evidence.channel || 'unknown'}>`,
    `* **Timestamp:** ${artifact.evidence.timestamp || 'Unavailable'}`,
    ``,
    `## AI Analysis`,
    `*Clearly marked as AI-generated:*`,
    artifact.technicalAnalysis || 'No analysis available.',
    ``,
    `## Metadata`,
    `* **Suggested Priority:** ${artifact.priority || 'P3'}`,
    `* **Suggested Labels:** ${labelsText}`,
    ``,
    `## Acceptance Criteria`,
    artifact.acceptanceCriteria && artifact.acceptanceCriteria.length > 0
      ? artifact.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')
      : 'Verify resolution with reporter.',
    ``,
    `## Related Conversations & Duplicates`,
    duplicateIssuesText
  ].join('\n');

  return {
    title: artifact.title,
    description,
    priority: artifact.priority
  };
}
