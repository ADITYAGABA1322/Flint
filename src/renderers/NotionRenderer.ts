import type { EngineeringArtifact } from '../../contracts/artifact';

export function renderNotion(artifact: EngineeringArtifact): { title: string; blocks: any[] } {
  const blocks: any[] = [];

  // Executive Summary heading + text
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: 'Executive Summary' } }] }
  });
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: [{ text: { content: artifact.executiveSummary || 'None.' } }] }
  });

  // Details
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: 'Details' } }] }
  });
  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: `Observed Behavior: ${artifact.observedBehavior || 'Not specified.'}` } }] }
  });
  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: `Expected Behavior: ${artifact.expectedBehavior || 'Not specified.'}` } }] }
  });
  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: `Business Impact: ${artifact.businessImpact || 'Not specified.'}` } }] }
  });

  // Evidence
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: 'Evidence' } }] }
  });
  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: `Slack Thread: ${artifact.evidence.slackUrl || 'Unavailable'}` } }] }
  });
  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: `Reporter: ${artifact.evidence.reporter || 'unknown'}` } }] }
  });
  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: `Channel: ${artifact.evidence.channel || 'unknown'}` } }] }
  });
  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: `Timestamp: ${artifact.evidence.timestamp || 'Unavailable'}` } }] }
  });

  // AI Analysis (Quote block)
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: 'AI Analysis' } }] }
  });
  blocks.push({
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [{ text: { content: `Clearly marked as AI-generated:\n${artifact.technicalAnalysis || 'No analysis available.'}` } }]
    }
  });

  // Acceptance Criteria (ToDo blocks)
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: 'Acceptance Criteria' } }] }
  });
  if (artifact.acceptanceCriteria && artifact.acceptanceCriteria.length > 0) {
    artifact.acceptanceCriteria.forEach((crit) => {
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ text: { content: crit } }],
          checked: false
        }
      });
    });
  } else {
    blocks.push({
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'Verify resolution with reporter.' } }],
        checked: false
      }
    });
  }

  // Related issues / Duplicates
  if (artifact.relatedIssues && artifact.relatedIssues.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ text: { content: 'Related Conversations & Duplicates' } }] }
    });
    artifact.relatedIssues.forEach((issue) => {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: `${issue.id} - ${issue.title} (Status: ${issue.status}) ` } }
          ]
        }
      });
    });
  }

  return {
    title: artifact.title,
    blocks
  };
}
