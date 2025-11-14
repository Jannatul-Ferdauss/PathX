// apiProviderService.js - Unified API Provider with auto-fallback
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// API Provider Types
export const API_PROVIDERS = {
  GEMINI: 'gemini',
  OPENROUTER: 'openrouter',
  GROQ: 'groq',
};

// Default configuration
const DEFAULT_CONFIG = {
  primaryProvider: API_PROVIDERS.GEMINI,
  fallbackProvider: API_PROVIDERS.GROQ,
  secondFallbackProvider: API_PROVIDERS.OPENROUTER,
  geminiApiKey: process.env.REACT_APP_GEMINI_API_KEY || '',
  openrouterApiKey: process.env.REACT_APP_OPENROUTER_API_KEY || '',
  groqApiKey: process.env.REACT_APP_GROQ_API_KEY || '',
  geminiModel: 'gemini-2.5-flash',
  openrouterModel: 'google/gemini-2.0-flash-exp:free',
  groqModel: 'llama-3.3-70b-versatile',
  autoFallback: true,
};

let cachedConfig = null;

/**
 * Get API configuration from Firestore (admin-managed)
 */
export const getAPIConfig = async () => {
  if (cachedConfig) return cachedConfig;

  try {
    const configDoc = await getDoc(doc(db, 'admin_settings', 'api_config'));
    
    if (configDoc.exists()) {
      cachedConfig = { ...DEFAULT_CONFIG, ...configDoc.data() };
    } else {
      cachedConfig = DEFAULT_CONFIG;
    }
    
    return cachedConfig;
  } catch (error) {
    console.warn('Failed to load API config from Firestore, using defaults:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * Update API configuration (Admin only)
 */
export const updateAPIConfig = async (newConfig) => {
  try {
    await setDoc(doc(db, 'admin_settings', 'api_config'), {
      ...newConfig,
      updatedAt: new Date().toISOString(),
    });
    
    cachedConfig = null; // Clear cache
    console.log('✅ API Configuration updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to update API config:', error);
    throw new Error('Failed to update API configuration');
  }
};

/**
 * Call Gemini API
 */
const callGeminiAPI = async (prompt, config) => {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: config.geminiModel });
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    return {
      success: true,
      provider: API_PROVIDERS.GEMINI,
      response,
      model: config.geminiModel,
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`GEMINI_ERROR: ${error.message}`);
  }
};

/**
 * Call OpenRouter API
 */
const callOpenRouterAPI = async (prompt, config) => {
  if (!config.openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY_MISSING');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PathX Career Platform',
      },
      body: JSON.stringify({
        model: config.openrouterModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        route: 'fallback', // Allow fallback to non-free models if free models unavailable
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      
      // Provide helpful guidance for common errors
      if (errorMessage.includes('data policy') || errorMessage.includes('No endpoints found')) {
        throw new Error(
          'OpenRouter privacy settings need configuration. ' +
          'Visit https://openrouter.ai/settings/privacy and allow "Free model publication" or use a paid model. ' +
          'Original error: ' + errorMessage
        );
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter');
    }

    return {
      success: true,
      provider: API_PROVIDERS.OPENROUTER,
      response: data.choices[0].message.content,
      model: config.openrouterModel,
    };
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw new Error(`OPENROUTER_ERROR: ${error.message}`);
  }
};

/**
 * Call Groq API
 */
const callGroqAPI = async (prompt, config) => {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY_MISSING');
  }

  try {
    // Trim any whitespace from API key
    const apiKey = config.groqApiKey.trim();
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.groqModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      
      // Provide helpful error messages
      if (response.status === 401) {
        throw new Error(
          'Invalid Groq API key. Please verify your API key at https://console.groq.com/keys. ' +
          'Make sure you copied the entire key without any extra spaces.'
        );
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Groq');
    }

    return {
      success: true,
      provider: API_PROVIDERS.GROQ,
      response: data.choices[0].message.content,
      model: config.groqModel,
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`GROQ_ERROR: ${error.message}`);
  }
};

/**
 * Generate AI response with automatic fallback
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Response object with provider info
 */
export const generateAIResponse = async (prompt, options = {}) => {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Invalid prompt: prompt must be a non-empty string');
  }

  const config = await getAPIConfig();
  const { forceProvider, skipFallback = false } = options;

  // Determine which provider to try first
  const primaryProvider = forceProvider || config.primaryProvider;
  const shouldFallback = config.autoFallback && !skipFallback && !forceProvider;

  let lastError = null;

  // Try primary provider
  try {
    console.log(`🤖 Attempting ${primaryProvider.toUpperCase()} API...`);
    
    if (primaryProvider === API_PROVIDERS.GEMINI) {
      return await callGeminiAPI(prompt, config);
    } else if (primaryProvider === API_PROVIDERS.OPENROUTER) {
      return await callOpenRouterAPI(prompt, config);
    } else if (primaryProvider === API_PROVIDERS.GROQ) {
      return await callGroqAPI(prompt, config);
    } else {
      throw new Error(`Unknown provider: ${primaryProvider}`);
    }
  } catch (error) {
    lastError = error;
    console.warn(`⚠️ ${primaryProvider.toUpperCase()} failed:`, error.message);
    
    // Don't fallback if specific provider was forced or fallback disabled
    if (!shouldFallback) {
      throw error;
    }
  }

  // Try first fallback provider
  const fallbackProvider = config.fallbackProvider;
  let fallbackError = null;

  try {
    console.log(`🔄 Falling back to ${fallbackProvider.toUpperCase()} API...`);
    
    if (fallbackProvider === API_PROVIDERS.GEMINI) {
      return await callGeminiAPI(prompt, config);
    } else if (fallbackProvider === API_PROVIDERS.OPENROUTER) {
      return await callOpenRouterAPI(prompt, config);
    } else if (fallbackProvider === API_PROVIDERS.GROQ) {
      return await callGroqAPI(prompt, config);
    }
  } catch (error) {
    fallbackError = error;
    console.warn(`⚠️ First fallback ${fallbackProvider.toUpperCase()} also failed:`, error.message);
  }

  // Try second fallback provider
  const secondFallbackProvider = config.secondFallbackProvider;
  
  if (secondFallbackProvider) {
    try {
      console.log(`🔄 Falling back to ${secondFallbackProvider.toUpperCase()} API (2nd fallback)...`);
      
      if (secondFallbackProvider === API_PROVIDERS.GEMINI) {
        return await callGeminiAPI(prompt, config);
      } else if (secondFallbackProvider === API_PROVIDERS.OPENROUTER) {
        return await callOpenRouterAPI(prompt, config);
      } else if (secondFallbackProvider === API_PROVIDERS.GROQ) {
        return await callGroqAPI(prompt, config);
      }
    } catch (secondFallbackError) {
      console.error(`❌ Second fallback ${secondFallbackProvider.toUpperCase()} also failed:`, secondFallbackError.message);
      
      // All three providers failed
      throw new Error(
        `All AI providers failed. Primary (${primaryProvider}): ${lastError.message}. ` +
        `1st Fallback (${fallbackProvider}): ${fallbackError.message}. ` +
        `2nd Fallback (${secondFallbackProvider}): ${secondFallbackError.message}`
      );
    }
  }
  
  // Only two providers configured and both failed
  throw new Error(
    `All configured AI providers failed. Primary (${primaryProvider}): ${lastError.message}. ` +
    `Fallback (${fallbackProvider}): ${fallbackError.message}`
  );
};

/**
 * Test API provider connection
 */
export const testAPIProvider = async (provider, apiKey, model) => {
  const testPrompt = 'Respond with "Hello from PathX!" to confirm connection.';
  
  try {
    const testConfig = {
      ...DEFAULT_CONFIG,
    };

    // Set the appropriate API key and model based on provider
    if (provider === API_PROVIDERS.GEMINI) {
      testConfig.geminiApiKey = apiKey;
      testConfig.geminiModel = model;
    } else if (provider === API_PROVIDERS.OPENROUTER) {
      testConfig.openrouterApiKey = apiKey;
      testConfig.openrouterModel = model;
    } else if (provider === API_PROVIDERS.GROQ) {
      testConfig.groqApiKey = apiKey;
      testConfig.groqModel = model;
    }

    let result;
    if (provider === API_PROVIDERS.GEMINI) {
      result = await callGeminiAPI(testPrompt, testConfig);
    } else if (provider === API_PROVIDERS.OPENROUTER) {
      result = await callOpenRouterAPI(testPrompt, testConfig);
    } else if (provider === API_PROVIDERS.GROQ) {
      result = await callGroqAPI(testPrompt, testConfig);
    } else {
      throw new Error('Invalid provider');
    }

    return {
      success: true,
      message: `✅ ${provider.toUpperCase()} connection successful`,
      response: result.response,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ ${provider.toUpperCase()} connection failed: ${error.message}`,
    };
  }
};

/**
 * Get available models for each provider
 */
export const getAvailableModels = (provider) => {
  const models = {
    [API_PROVIDERS.GEMINI]: [
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    ],
    [API_PROVIDERS.OPENROUTER]: [
      { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
      { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
      { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
      { value: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (Free)' },
      { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
    ],
    [API_PROVIDERS.GROQ]: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
      { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
      { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
  };

  return models[provider] || [];
};

/**
 * Clear cached configuration (useful after updates)
 */
export const clearConfigCache = () => {
  cachedConfig = null;
};
