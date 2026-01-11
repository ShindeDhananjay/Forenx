import { CaseRecord, Entity, TimelineEvent, AILink, CrossCaseLink } from '../types';
import { MOCK_CASES } from './mockData';
import { analysisService } from './analysisService';

const DB_KEY_CASES = 'forenx_db_cases';
const DB_KEY_LINKS = 'forenx_db_cross_case_links';
const DB_KEY_NEW_LINKS_FLAG = 'forenx_new_links_flag';

interface CaseData {
  entities: Entity[];
  timeline: TimelineEvent[];
  links: AILink[];
}

// --- Module-Scoped Functions to avoid 'this' context issues ---

function getAllCases(): CaseRecord[] {
  const data = localStorage.getItem(DB_KEY_CASES);
  return data ? JSON.parse(data) : [];
}

function saveAllCases(cases: CaseRecord[]) {
  localStorage.setItem(DB_KEY_CASES, JSON.stringify(cases));
}

function getCrossCaseLinks(): CrossCaseLink[] {
  const data = localStorage.getItem(DB_KEY_LINKS);
  return data ? JSON.parse(data) : [];
}

function saveCrossCaseLinks(links: CrossCaseLink[]) {
  localStorage.setItem(DB_KEY_LINKS, JSON.stringify(links));
}

function getCaseData(caseId: string): CaseData {
  const data = localStorage.getItem(`forenx_data_${caseId}`);
  if (!data) return { entities: [], timeline: [], links: [] };
  const parsedData = JSON.parse(data);
  return {
    entities: parsedData.entities || [],
    timeline: parsedData.timeline || [],
    links: parsedData.links || [],
  };
}

function saveCaseData(caseId: string, data: CaseData) {
  localStorage.setItem(`forenx_data_${caseId}`, JSON.stringify(data));
}

function addCase(newCase: CaseRecord) {
  const cases = getAllCases();
  cases.unshift(newCase);
  saveAllCases(cases);
}

function setHasNewLinks(status: boolean) {
  localStorage.setItem(DB_KEY_NEW_LINKS_FLAG, JSON.stringify(status));
}

function addCrossCaseLinks(newLinks: CrossCaseLink[]) {
  const existingLinks = getCrossCaseLinks();
  const uniqueNewLinks = newLinks.filter(
    (nl) => !existingLinks.some(
      (el) => (el.sourceCaseId === nl.sourceCaseId && el.targetCaseId === nl.targetCaseId && el.evidence === nl.evidence) ||
             (el.sourceCaseId === nl.targetCaseId && el.targetCaseId === nl.sourceCaseId && el.evidence === nl.evidence)
    )
  );
  if(uniqueNewLinks.length > 0) {
    const allLinks = [...existingLinks, ...uniqueNewLinks];
    saveCrossCaseLinks(allLinks);
  }
}

function initializeDatabase() {
  const cases = getAllCases();
  if (cases.length === 0) {
    MOCK_CASES.forEach(mockCase => {
      addCase(mockCase.record);
      saveCaseData(mockCase.record.id, mockCase.data);
    });
    
    const allSeededCases = getAllCases();
    let allNewLinks: CrossCaseLink[] = [];

    for (let i = 0; i < allSeededCases.length; i++) {
      const caseA = allSeededCases[i];
      const dataA = getCaseData(caseA.id);
      const newLinks = analysisService.analyzeCrossCaseSimilarities(caseA, { entities: dataA.entities });
      allNewLinks = [...allNewLinks, ...newLinks];
    }
    
    if (allNewLinks.length > 0) {
      addCrossCaseLinks(allNewLinks);
      setHasNewLinks(true);
    }
  }
}

function deleteCase(id: string) {
  let cases = getAllCases();
  cases = cases.filter(c => c.id !== id);
  saveAllCases(cases);

  // Also delete associated data and any links involving this case
  localStorage.removeItem(`forenx_data_${id}`);
  const links = getCrossCaseLinks().filter(l => l.sourceCaseId !== id && l.targetCaseId !== id);
  saveCrossCaseLinks(links);
}

function getStats() {
  const cases = getAllCases();
  return {
    total: cases.length,
    completed: cases.filter(c => c.status === 'Completed').length,
    inProgress: cases.filter(c => c.status === 'Processing').length,
    critical: cases.filter(c => c.riskScore > 75).length
  };
}

function getHasNewLinks(): boolean {
  const status = localStorage.getItem(DB_KEY_NEW_LINKS_FLAG);
  return status ? JSON.parse(status) : false;
}

// Export a single service object mapping to the functions
export const dbService = {
  initializeDatabase,
  getAllCases,
  addCase,
  deleteCase,
  getStats,
  saveCaseData,
  getCaseData,
  getCrossCaseLinks,
  saveCrossCaseLinks,
  addCrossCaseLinks,
  setHasNewLinks,
  getHasNewLinks
};