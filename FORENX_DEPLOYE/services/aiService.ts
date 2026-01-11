import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisSummary, TimelineEvent, Entity, EntityType, AILink, CaseRecord } from "../types";

// FIX: Define and export a custom error for API key issues.
export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiKeyError";
  }
}

// Helper to get AI instance safely
const getAI = () => {
  // --- TEMPORARY HARDCODED API KEY ---
  // IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual Gemini API key.
  // This is a temporary solution for quick deployment. For production, it's
  // highly recommended to use environment variables to keep your key secure.
  const apiKey = "AIzaSyBQvBG4E3bRXF0UYQoZggRoLnx5vVLwx1Q";

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    // If the key is still the placeholder, throw an error to remind the user.
    throw new ApiKeyError("API key is not set. Please replace 'YOUR_API_KEY_HERE' in services/aiService.ts with your actual Gemini API key.");
  }

  return new GoogleGenAI({ apiKey: apiKey });
};


// --- New Audio Helper Functions ---
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


/**
 * Generates speech from text using Gemini TTS.
 * @param textToSpeak The text to convert to speech.
 * @returns A base64 encoded string of the audio data, or null on failure.
 */
export const generateSpeech = async (textToSpeak: string): Promise<string | null> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: textToSpeak }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' }, // A friendly, professional voice
            },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
    
  } catch (error) {
    console.error("AI Speech Generation Failed:", error);
    // Fail silently so the app doesn't crash if TTS fails
    return null;
  }
};


/**
 * Extracts structured forensic data from raw text using Gemini AI.
 */
export const extractDataFromText = async (filename: string, textContent: string): Promise<{ entities: Entity[], timeline: TimelineEvent[], links: AILink[] }> => {

  // Truncate text to fit context window if necessary
  const truncatedText = textContent.length > 50000 ? textContent.substring(0, 50000) + "...(truncated)" : textContent;

  const model = "gemini-3-flash-preview";
  
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: `
        You are a digital forensic extraction tool. 
        Analyze the following text extracted from a file named "${filename}".
        
        Extract specific entities, timeline events, and the relationships between entities.
        
        1. Entities: Find names (Person), phone numbers (Phone), emails (Email), physical addresses (Location), and device names/IDs (Device).
        2. Timeline: Identify specific events with timestamps, types (CALL, SMS, APP_USAGE, LOCATION, SYSTEM), and descriptions.
        3. Links: Identify direct relationships between entities. For example, a Person sending an SMS from a Phone, or an Email being associated with a Person. Return these as an array of 'links'. Each link should contain the string 'value' of the source entity, the string 'value' of the target entity, and a brief 'reason' for the connection.
        
        Return a JSON object containing three arrays: 'entities', 'timeline', and 'links'.
        
        Text Data:
        ${truncatedText}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['Person', 'Phone', 'Email', 'Location', 'Device'] },
                  value: { type: Type.STRING },
                  relevance: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                },
                required: ['type', 'value', 'relevance']
              }
            },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "ISO 8601 format if possible, or string" },
                  type: { type: Type.STRING, enum: ['CALL', 'SMS', 'APP_USAGE', 'LOCATION', 'SYSTEM'] },
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low', 'Info'] }
                },
                required: ['timestamp', 'type', 'description', 'severity']
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceValue: { type: Type.STRING, description: "The 'value' of the source entity." },
                  targetValue: { type: Type.STRING, description: "The 'value' of the target entity." },
                  reason: { type: Type.STRING, description: "A brief explanation of the relationship." }
                },
                required: ['sourceValue', 'targetValue', 'reason']
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Map to internal types with IDs
    const mappedEntities: Entity[] = (result.entities || []).map((e: any, idx: number) => ({
      id: `ext-e-${idx}`,
      type: e.type as EntityType,
      value: e.value,
      relevance: e.relevance,
      lastSeen: new Date().toISOString().substring(0, 10),
      metadata: { source: filename }
    }));

    const mappedTimeline: TimelineEvent[] = (result.timeline || []).map((t: any, idx: number) => ({
      id: `ext-t-${idx}`,
      timestamp: t.timestamp,
      type: t.type,
      description: t.description,
      source: filename,
      severity: t.severity
    }));

    const entityValueMap = new Map(mappedEntities.map(e => [e.value, e.id]));
    const mappedLinks: AILink[] = (result.links || []).map((l: any) => ({
        source: entityValueMap.get(l.sourceValue) || '',
        target: entityValueMap.get(l.targetValue) || '',
        reason: l.reason
    })).filter(l => l.source && l.target); // Filter out links where entities weren't found

    return { entities: mappedEntities, timeline: mappedTimeline, links: mappedLinks };

  } catch (error: any) {
    console.error("AI Extraction Failed:", error);
    // Pass the error message up to the UI
    throw error; // Re-throw the original error to be handled by the caller
  }
};

export const generateForensicSummary = async (
  entities: Entity[],
  timeline: TimelineEvent[]
): Promise<AnalysisSummary> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are a digital forensics expert AI named ForenX. Analyze the following extracted data.
    
    Entities Found:
    ${JSON.stringify(entities.map(e => `${e.type}: ${e.value} (${e.relevance})`))}

    Recent Timeline Events:
    ${JSON.stringify(timeline.map(e => `[${e.timestamp}] ${e.type}: ${e.description} (${e.severity})`))}

    Task:
    1. Assess the risk level (0-100).
    2. Write a professional executive summary.
    3. List key findings.
    4. Provide recommendations.
    
    Return JSON.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING, enum: ['Critical', 'High', 'Moderate', 'Low'] },
            summaryText: { type: Type.STRING },
            keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['riskScore', 'riskLevel', 'summaryText', 'keyFindings', 'recommendations']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as AnalysisSummary;
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    // Re-throw the error for the UI to handle, including the ApiKeyError
    throw error;
  }
};

export async function* generateLinkAnalysisSummaryStream(
  caseA: CaseRecord,
  caseAData: { entities: Entity[], timeline: TimelineEvent[] },
  caseB: CaseRecord,
  caseBData: { entities: Entity[], timeline: TimelineEvent[] },
  sharedEvidence: { type: string, value: string }
): AsyncGenerator<string> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are a forensic investigator AI. You have found a link between two separate cases.
    The shared evidence is a ${sharedEvidence.type} with the value: ${sharedEvidence.value}.

    Case A (${caseA.caseNumber}):
    - Key Entities: ${JSON.stringify(caseAData.entities.map(e => `${e.type}: ${e.value}`))}.
    - Relevant Timeline Events: ${JSON.stringify(caseAData.timeline.filter(t => t.description.includes(sharedEvidence.value)))}.

    Case B (${caseB.caseNumber}):
    - Key Entities: ${JSON.stringify(caseBData.entities.map(e => `${e.type}: ${e.value}`))}.
    - Relevant Timeline Events: ${JSON.stringify(caseBData.timeline.filter(t => t.description.includes(sharedEvidence.value)))}.
    
    Task: Write a short, insightful summary (2-3 sentences) for an investigator explaining the significance of this connection. Focus on the context of how the shared evidence was used in each case. Do not return markdown.
  `;

  try {
    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({ model, contents: prompt });
    for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
            yield text;
        }
    }
  } catch (error) {
    console.error("AI Correlation Summary Stream Failed:", error);
    throw error;
  }
};
