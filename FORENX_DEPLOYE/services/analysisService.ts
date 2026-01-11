import { dbService } from './dbService';
import { CaseRecord, Entity, CrossCaseLink } from '../types';

interface CaseData {
    entities: Entity[];
}

export const analysisService = {
    /**
     * Compares a newly uploaded case against all existing cases to find shared entities.
     * @param newCase The record for the newly uploaded case.
     * @param newCaseData The data extracted from the new case.
     * @returns An array of CrossCaseLink objects representing found correlations.
     */
    analyzeCrossCaseSimilarities: (newCase: CaseRecord, newCaseData: CaseData): CrossCaseLink[] => {
        const newLinks: CrossCaseLink[] = [];
        const allCases = dbService.getAllCases();
        const existingCases = allCases.filter(c => c.id !== newCase.id);

        if (existingCases.length === 0 || newCaseData.entities.length === 0) {
            return [];
        }

        for (const existingCase of existingCases) {
            const existingCaseData = dbService.getCaseData(existingCase.id);
            if (existingCaseData.entities.length === 0) continue;

            for (const newEntity of newCaseData.entities) {
                // Ignore low-relevance entities for correlation to reduce noise
                if (newEntity.relevance === 'Low') continue;

                for (const existingEntity of existingCaseData.entities) {
                    if (existingEntity.relevance === 'Low') continue;

                    if (newEntity.type === existingEntity.type && newEntity.value === existingEntity.value) {
                        // Found a match!
                        const newLink: CrossCaseLink = {
                            id: `${newCase.id}-${existingCase.id}-${newEntity.value}`,
                            sourceCaseId: newCase.id,
                            targetCaseId: existingCase.id,
                            sourceCaseNumber: newCase.caseNumber,
                            targetCaseNumber: existingCase.caseNumber,
                            reason: `Shared ${newEntity.type}`,
                            evidence: newEntity.value,
                            strength: newEntity.relevance === 'High' || existingEntity.relevance === 'High' ? 'High' : 'Medium'
                        };
                        newLinks.push(newLink);
                    }
                }
            }
        }
        
        return newLinks;
    }
};
