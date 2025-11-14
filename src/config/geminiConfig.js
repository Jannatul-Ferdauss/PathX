// geminiConfig.js - Gemini API Configuration
// Store API key in environment variables for security

export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    '⚠️ GEMINI_API_KEY not found in environment variables. ' +
    'Add REACT_APP_GEMINI_API_KEY to your .env file to enable skill extraction.'
  ); 
}

export const GEMINI_CONFIG = {
  apiKey: GEMINI_API_KEY,
  model: 'gemini-2.0-flash-exp', // Using Gemini 2.0 Flash Experimental
}; 
