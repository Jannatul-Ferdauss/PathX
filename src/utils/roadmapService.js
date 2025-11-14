// roadmapService.js
// Generates personalized career roadmaps using AI and saves to Firestore
import { generateAIResponse } from '../services/apiProviderService';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Generate a structured roadmap using Gemini model.
 * Inputs are dynamic per-request (do not use stored profile values).
 * Returns an object { success, roadmap, rawText }
 */
export const generateRoadmap = async ({ currentSkills, targetRole, timeframeMonths = 3, weeklyHours = 6 }) => {
  // Build a deterministic prompt that asks for JSON output
  const prompt = `You are an expert career coach. Create a personalized, actionable career roadmap for a user.

INPUT:
- Current skills: ${currentSkills || 'None provided'}
- Target role: ${targetRole}
- Timeframe (months): ${timeframeMonths}
- Available study hours per week: ${weeklyHours}

OUTPUT (strict JSON, no markdown):
{
  "summary": "One-sentence summary",
  "phases": [
    { "title": "Phase 1 - ...", "durationWeeks": 4, "focus": ["topic1","topic2"], "projects": ["project idea 1"] },
    ...
  ],
  "applySuggestion": "When to start applying (text)",
  "estimatedWeeklyPlan": "Short weekly plan text",
  "timestamp": "ISO timestamp"
}

Requirements:
- Keep phases grouped by weeks or months aligned with timeframe.
- Provide specific technologies/topics to learn and 1-2 small project ideas per phase.
- Suggest when to start applying and what to include in applications.
- Keep responses concise and practical.`;

  try {
    // Use unified API provider with auto-fallback
    const result = await generateAIResponse(prompt);
    const rawText = result.response;

    // Clean up markdown code blocks if present
    let cleanedText = rawText.trim();
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    }
    
    // Try to parse JSON; if parse fails, include rawText in error
    let roadmap = null;
    try {
      roadmap = JSON.parse(cleanedText);
    } catch (err) {
      throw new Error('Failed to parse AI response as JSON: ' + err.message + '\nAI output:\n' + rawText);
    }

    // Attach a timestamp if missing
    if (!roadmap.timestamp) roadmap.timestamp = new Date().toISOString();

    return { success: true, roadmap, rawText };
  } catch (error) {
    console.error('Roadmap generation error:', error);
    return { success: false, error: error.message || String(error) };
  }
};

/**
 * Save roadmap to Firestore under `users/{uid}/roadmaps`.
 */
export const saveRoadmapForUser = async (uid, roadmap) => {
  if (!uid) throw new Error('UID required to save roadmap');
  const colRef = collection(db, 'users', uid, 'roadmaps');
  const payload = { ...roadmap, savedAt: serverTimestamp() };
  const docRef = await addDoc(colRef, payload);
  return { success: true, id: docRef.id };
};

/**
 * Convenience: generate and save for current logged in user
 */
export const generateAndSaveForCurrentUser = async (inputs) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User must be logged in to save roadmap');

  const gen = await generateRoadmap(inputs);
  if (!gen.success) return gen;

  const saveRes = await saveRoadmapForUser(currentUser.uid, gen.roadmap);
  return { ...gen, saveRes };
};
