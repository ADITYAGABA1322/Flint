export interface RelatedIssue {
  id: string;
  title: string;
  status: string;
  url: string;
  similarity?: number;
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
}
