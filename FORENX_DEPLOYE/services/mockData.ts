import { CaseRecord, Entity, TimelineEvent, AILink, EntityType } from '../types';

export interface MockCase {
  record: CaseRecord;
  data: {
    entities: Entity[];
    timeline: TimelineEvent[];
    links: AILink[];
  };
}

const mockCase1Id = 'mock_case_1';
const mockCase2Id = 'mock_case_2';
const mockCase3Id = 'mock_case_3';
const mockCase4Id = 'mock_case_4';

const mockEntities1: Entity[] = [
  { id: 'ent1-1', type: EntityType.PERSON, value: 'Markus Thorne', relevance: 'High', lastSeen: '2023-10-25' },
  { id: 'ent1-2', type: EntityType.PHONE, value: '+1-555-888-9999', relevance: 'High', lastSeen: '2023-10-26' },
  { id: 'ent1-3', type: EntityType.EMAIL, value: 'm.thorne@darknet.io', relevance: 'Medium', lastSeen: '2023-10-24' },
  { id: 'ent1-4', type: EntityType.LOCATION, value: 'Warehouse 7, Port District', relevance: 'High', lastSeen: '2023-10-25' },
  { id: 'ent1-5', type: EntityType.DEVICE, value: 'Laptop-MT7', relevance: 'High', lastSeen: '2023-10-25' },
];

const mockTimeline1: TimelineEvent[] = [
  { id: 'evt1-1', timestamp: '2023-10-26T14:30:00Z', type: 'CALL', description: 'Outgoing call from +1-555-888-9999 to +1-555-123-4567 (Duration: 120s)', source: 'Alpha Report', severity: 'High' },
  { id: 'evt1-2', timestamp: '2023-10-25T19:05:00Z', type: 'LOCATION', description: 'Device located near Warehouse 7, Port District', source: 'Alpha Report', severity: 'Medium' },
  { id: 'evt1-3', timestamp: '2023-10-25T20:15:00Z', type: 'APP_USAGE', description: 'Encrypted chat app "Signal" used on Laptop-MT7', source: 'Alpha Report', severity: 'High' },
];

const mockCase2Entities: Entity[] = [
  { id: 'ent2-1', type: EntityType.PERSON, value: 'Alina Petrova', relevance: 'Medium', lastSeen: '2023-11-01' },
  { id: 'ent2-2', type: EntityType.PHONE, value: '+1-555-888-9999', relevance: 'High', lastSeen: '2023-11-02' },
  { id: 'ent2-3', type: EntityType.DEVICE, value: 'Burner Phone (Model ZX-81)', relevance: 'High', lastSeen: '2023-11-02' },
  { id: 'ent2-4', type: EntityType.EMAIL, value: 'a.petrova@proton.me', relevance: 'Medium', lastSeen: '2023-11-01' },
  { id: 'ent2-5', type: EntityType.LOCATION, value: 'Pier 4, Downtown', relevance: 'Medium', lastSeen: '2023-11-02' },
];

const mockCase2Timeline: TimelineEvent[] = [
  { id: 'evt2-1', timestamp: '2023-11-02T09:15:00Z', type: 'SMS', description: 'SMS from +1-555-888-9999: "The package is ready. Usual spot."', source: 'Bravo Image', severity: 'High' },
  { id: 'evt2-2', timestamp: '2023-11-02T09:18:00Z', type: 'SYSTEM', description: 'Device data wiped remotely.', source: 'Bravo Image', severity: 'High' },
];


export const MOCK_CASES: MockCase[] = [
  {
    record: {
      id: mockCase1Id,
      caseNumber: 'CASE-2024-0001',
      filename: 'Alpha Report.pdf',
      uploadDate: '2024-05-20T10:00:00Z',
      status: 'Completed',
      size: '1.2 MB',
      riskScore: 85,
      investigator: 'System',
    },
    data: {
      entities: mockEntities1,
      timeline: mockTimeline1,
      links: [
        { source: 'ent1-1', target: 'ent1-2', reason: 'Owner of Phone' },
        { source: 'ent1-1', target: 'ent1-3', reason: 'Owner of Email' },
        { source: 'ent1-1', target: 'ent1-5', reason: 'Owner of Device' },
      ],
    },
  },
  {
    record: {
      id: mockCase2Id,
      caseNumber: 'CASE-2024-0002',
      filename: 'Bravo Image.zip',
      uploadDate: '2024-05-21T11:30:00Z',
      status: 'Completed',
      size: '25.6 MB',
      riskScore: 70,
      investigator: 'System',
    },
    data: {
      entities: mockCase2Entities,
      timeline: mockCase2Timeline,
      links: [
        { source: 'ent2-1', target: 'ent2-2', reason: 'Associated with Phone' },
        { source: 'ent2-1', target: 'ent2-4', reason: 'Owner of Email' },
      ],
    },
  },
  {
    record: {
      id: mockCase3Id,
      caseNumber: 'CASE-2024-0003',
      filename: 'Charlie Financials.csv',
      uploadDate: '2024-05-22T15:00:00Z',
      status: 'Completed',
      size: '450 KB',
      riskScore: 30,
      investigator: 'System',
    },
    data: {
      entities: [
        { id: 'ent3-1', type: EntityType.PERSON, value: 'Robert Vance', relevance: 'Low', lastSeen: '2024-01-10' },
        { id: 'ent3-2', type: EntityType.EMAIL, value: 'accounting@vance.corp', relevance: 'Low', lastSeen: '2024-01-10' },
        { id: 'ent3-3', type: EntityType.PERSON, value: 'Susan Hayes', relevance: 'Low', lastSeen: '2024-01-11' },
      ],
      timeline: [
        { id: 'evt3-1', timestamp: '2024-01-10T12:00:00Z', type: 'SYSTEM', description: 'Account login from new device.', source: 'Charlie Financials', severity: 'Info' },
        { id: 'evt3-2', timestamp: '2024-01-11T14:30:00Z', type: 'SYSTEM', description: 'Transaction of $5,000 to offshore account.', source: 'Charlie Financials', severity: 'Medium' },
      ],
      links: [
         { source: 'ent3-1', target: 'ent3-2', reason: 'Company Email' },
      ],
    },
  },
  {
    record: {
      id: mockCase4Id,
      caseNumber: 'CASE-2024-0004',
      filename: 'Delta Logs.txt',
      uploadDate: '2024-05-23T09:00:00Z',
      status: 'Completed',
      size: '87 KB',
      riskScore: 45,
      investigator: 'System',
    },
    data: {
      entities: [
        { id: 'ent4-1', type: EntityType.PERSON, value: 'John Doe', relevance: 'Medium', lastSeen: '2024-02-15' },
        { id: 'ent4-2', type: EntityType.DEVICE, value: 'Workstation-JD4', relevance: 'Medium', lastSeen: '2024-02-15' },
        // This entity is shared with Case 1 to create a link
        { id: 'ent4-3', type: EntityType.PERSON, value: 'Markus Thorne', relevance: 'High', lastSeen: '2024-02-14' },
      ],
      timeline: [
        { id: 'evt4-1', timestamp: '2024-02-15T18:00:00Z', type: 'SYSTEM', description: 'Login to Workstation-JD4 from unauthorized IP.', source: 'Delta Logs', severity: 'Medium' },
        { id: 'evt4-2', timestamp: '2024-02-14T11:00:00Z', type: 'SYSTEM', description: 'File access logs show user "m.thorne" accessed sensitive directory.', source: 'Delta Logs', severity: 'High' },
      ],
      links: [
         { source: 'ent4-1', target: 'ent4-2', reason: 'Owns Workstation' },
      ],
    },
  },
];