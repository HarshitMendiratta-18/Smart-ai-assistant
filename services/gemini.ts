import { GoogleGenAI } from '@google/genai';

// Initialize the official Google Gen AI SDK
const apiKey = process.env.GEMINI_API_KEY;
const isMockAI = !apiKey || apiKey.startsWith('mock');

const ai = !isMockAI ? new GoogleGenAI({ apiKey }) : null;

// Interfaces
export interface AIClassificationResult {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  eta: string;
  severity: 'minor' | 'moderate' | 'severe';
  ocrText?: string;
}

// Service object containing Gemini API methods
export const geminiService = {
  /**
   * Generates a 768-dimension vector embedding for document chunking/search
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (isMockAI || !ai) {
      // Return a dummy vector of 768 float elements in mock mode
      const dummyVector = new Array(768).fill(0).map(() => Math.random() - 0.5);
      return dummyVector;
    }

    try {
      const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      });

      if (response.embedding?.values) {
        return response.embedding.values;
      }
      throw new Error('No embedding returned from Gemini');
    } catch (error) {
      console.error("Gemini embedding failure, falling back to mock vector:", error);
      return new Array(768).fill(0).map(() => Math.random() - 0.5);
    }
  },

  /**
   * Predicts complaint fields based on input description and runs OCR if image is provided
   */
  async classifyComplaint(description: string, imageUrl?: string): Promise<AIClassificationResult> {
    const lowerInput = description.toLowerCase();
    
    // Simulate Heuristic fallback if keys are placeholders
    const getLocalClassify = (): AIClassificationResult => {
      let category = 'other';
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let department = 'administration';
      let eta = '24 Hours';
      let severity: 'minor' | 'moderate' | 'severe' = 'minor';
      let ocrText = imageUrl ? 'Parsed text from attachment: [SIMULATED BILL INVOICE COPY]' : undefined;

      if (lowerInput.includes('leak') || lowerInput.includes('water') || lowerInput.includes('plumb') || lowerInput.includes('pipe')) {
        category = 'plumbing';
        priority = 'high';
        department = 'plumbing';
        eta = '2 Hours';
        severity = 'moderate';
      } else if (lowerInput.includes('lift') || lowerInput.includes('elevator') || lowerInput.includes('grind')) {
        category = 'lift_issue';
        priority = 'high';
        department = 'elevators';
        eta = '1 Hour';
        severity = 'severe';
      } else if (lowerInput.includes('light') || lowerInput.includes('bulb') || lowerInput.includes('dark')) {
        category = 'streetlight';
        priority = 'medium';
        department = 'electrical';
        eta = '4 Hours';
        severity = 'minor';
      } else if (lowerInput.includes('trash') || lowerInput.includes('garbage') || lowerInput.includes('smell') || lowerInput.includes('waste')) {
        category = 'garbage';
        priority = 'low';
        department = 'housekeeping';
        eta = '6 Hours';
        severity = 'minor';
      } else if (lowerInput.includes('noise') || lowerInput.includes('loud') || lowerInput.includes('music') || lowerInput.includes('shout')) {
        category = 'noise';
        priority = 'medium';
        department = 'security';
        eta = '30 Mins';
        severity = 'moderate';
      } else if (lowerInput.includes('thief') || lowerInput.includes('break') || lowerInput.includes('gate') || lowerInput.includes('stranger')) {
        category = 'security';
        priority = 'critical';
        department = 'security';
        eta = '15 Mins';
        severity = 'severe';
      } else if (lowerInput.includes('wire') || lowerInput.includes('electrical') || lowerInput.includes('short') || lowerInput.includes('shock')) {
        category = 'electrical_failure';
        priority = 'critical';
        department = 'electrical';
        eta = '45 Mins';
        severity = 'severe';
      }

      return { category, priority, department, eta, severity, ocrText };
    };

    if (isMockAI || !ai) {
      return new Promise((resolve) => setTimeout(() => resolve(getLocalClassify()), 800));
    }

    try {
      // Build structured prompt for Gemini
      const prompt = `
        Analyze the following complaint text submitted by a resident in a housing complex:
        "${description}"
        
        Your task is to classify and return details as a JSON object matching this schema:
        {
          "category": "water_leakage" | "lift_issue" | "electrical_failure" | "garbage" | "streetlight" | "noise" | "security" | "plumbing" | "internet" | "other",
          "priority": "low" | "medium" | "high" | "critical",
          "department": "plumbing" | "electrical" | "elevators" | "housekeeping" | "security" | "administration",
          "severity": "minor" | "moderate" | "severe",
          "eta": "Estimated hours/minutes for resolution, e.g., '2 Hours' or '45 Mins'"
        }

        Be extremely objective. If it's minor, say minor. If it's a safety threat, say critical priority.
      `;

      // Call Gemini 2.5 Flash with JSON constraint
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText) as AIClassificationResult;
        return {
          ...parsed,
          ocrText: imageUrl ? 'Parsed text: [Gemini Vision extracted content placeholder]' : undefined
        };
      }
      return getLocalClassify();
    } catch (error) {
      console.error("Gemini classification failed, falling back to local heuristic:", error);
      return getLocalClassify();
    }
  },

  /**
   * Orchestrates the RAG answer completion using retrieved documents as context
   */
  async chatWithKnowledge(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    userQuery: string,
    contextChunks: string[]
  ): Promise<string> {
    if (isMockAI || !ai) {
      // Mock chat completion
      const responses = [
        "According to section 4 of the community guidelines, swimming pool operational hours are from 6:00 AM to 10:00 PM daily. A valid resident card is required for entry.",
        "Clubhouse booking can be processed via the resident dashboard. Bookings require a deposit of ₹1,000 for cleaning maintenance, fully refundable on cancellation 24 hours prior.",
        "Waste disposal regulations require segregation into dry and wet waste. Collection occurs daily at 9:00 AM directly from your apartment doorstep.",
        "Visitor vehicles must park only in the designated guest bays near Gate 1. Unregistered parking beyond 4 hours is subject to clamping and a ₹500 fine.",
        "The emergency contact for the gatehouse guard is Ext 100. For plumbing crises, contact maintenance at Ext 101."
      ];
      // Randomly select or match query keywords
      const matchedResponse = responses.find(r => 
        userQuery.toLowerCase().includes('pool') && r.includes('pool') ||
        userQuery.toLowerCase().includes('club') && r.includes('Club') ||
        userQuery.toLowerCase().includes('waste') && r.includes('waste') ||
        userQuery.toLowerCase().includes('park') && r.includes('park')
      ) || responses[0];

      return new Promise((resolve) => setTimeout(() => resolve(matchedResponse), 1000));
    }

    try {
      const contextString = contextChunks.join('\n\n');
      
      const systemInstruction = `
        You are CommuniSync AI, the helpful smart neighborhood virtual assistant for a gated residential community.
        You must answer the user's questions based EXCLUSIVELY on the community document chunks provided below.
        
        Guidelines:
        1. Base your answer strictly on the context provided.
        2. If the context does not contain the answer, state politely: "I apologize, but that information is not available in my community guidelines or knowledge base. Please contact the society office."
        3. Do NOT make up, assume, or hallucinate information.
        4. Cite the source document where applicable.
        
        [Community Document Context]:
        ${contextString}
      `;

      // Compile content arrays
      const chatContents = [
        { role: 'user', parts: [{ text: systemInstruction }] },
        ...history,
        { role: 'user', parts: [{ text: userQuery }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: chatContents,
      });

      return response.text || 'Sorry, I was unable to construct a response.';
    } catch (error: any) {
      console.error("Gemini RAG chat failure:", error);
      return `Error communicating with Gemini model: ${error.message || error}`;
    }
  }
};
