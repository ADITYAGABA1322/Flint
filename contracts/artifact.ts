export interface RelatedIssue {
  id: string;
  title: string;
  status: string;
  url: string;
  similarity?: number;
}

export interface LinearArtifact {
  title: string;
  conciseSummary: string;
  severity: string;
  reproduction: string;
  impact: string;
  acceptanceCriteria: string[];
}

export interface NotionArtifact {
  title: string;
  background: string;
  investigation: string;
  observations: string;
  technicalAnalysis: string;
  implementationIdeas: string;
  references: string;
  timeline: string;
}

export interface AsanaArtifact {
  title: string;
  checklist: string[];
  ownerPlaceholders: string;
  milestones: string;
  dependencies: string;
  dueSuggestion: string;
}

export interface EngineeringArtifact {
  title: string;
  executiveSummary: string;
  observedBehavior: string;
  expectedBehavior: string;
  businessImpact: string;
  technicalAnalysis: string;
  priority: string;
  labels: string[];
  evidence: {
    slackUrl?: string;
    reporter: string;
    channel: string;
    timestamp: string;
  };
  acceptanceCriteria: string[];
  relatedIssues: RelatedIssue[];
  linear?: LinearArtifact;
  notion?: NotionArtifact;
  asana?: AsanaArtifact;
}
