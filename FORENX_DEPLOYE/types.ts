export enum EntityType {
  PERSON = 'Person',
  PHONE = 'Phone',
  EMAIL = 'Email',
  LOCATION = 'Location',
  DEVICE = 'Device'
}

export interface Entity {
  id: string;
  type: EntityType;
  value: string;
  relevance: 'High' | 'Medium' | 'Low';
  lastSeen?: string;
  metadata?: Record<string, string>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'CALL' | 'SMS' | 'APP_USAGE' | 'LOCATION' | 'SYSTEM';
  description: string;
  source: string;
  severity: 'High' | 'Medium' | 'Low' | 'Info';
  details?: string;
}

export interface CaseRecord {
  id: string;
  caseNumber: string;
  filename: string;
  uploadDate: string;
  status: 'Processing' | 'Completed' | 'Failed';
  size: string;
  riskScore: number;
  investigator: string;
}

export interface AnalysisSummary {
  riskScore: number;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  summaryText: string;
  keyFindings: string[];
  recommendations: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  val: number; // size
}

export interface GraphLink {
  source: string;
  target: string;
  value: number; // thickness
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Represents an AI-identified link between two entities
export interface AILink {
  source: string; // id of source entity
  target: string; // id of target entity
  reason: string; // reason for the link
}

// Represents a link found between two separate cases
export interface CrossCaseLink {
  id: string;
  sourceCaseId: string;
  targetCaseId: string;
  sourceCaseNumber: string;
  targetCaseNumber: string;
  reason: string; // e.g., "Shared Entity: Phone"
  evidence: string; // The actual matching value, e.g., "+1-555..."
  strength: 'High' | 'Medium' | 'Low';
}