// careerBotService.js - AI-powered Career Mentor Assistant
import { generateAIResponse } from '../../services/apiProviderService';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * System prompt that defines CareerBot's behavior and guidelines
 */
const SYSTEM_PROMPT = `You are PathX CareerBot, an AI career mentor focused on youth employment and UN Sustainable Development Goal 8 (Decent Work and Economic Growth).

YOUR ROLE:
- Help users explore career paths aligned with their skills and interests
- Provide actionable learning recommendations
- Support job search strategies and career development
- Focus on youth employment, skill development, and decent work opportunities

GUIDELINES:
1. Be encouraging, supportive, and youth-friendly
2. Provide specific, actionable advice tailored to the user's context
3. Always clarify you're providing suggestions, not guarantees
4. Consider SDG 8 principles: decent work, economic growth, equal opportunities
5. Recommend realistic learning paths and skill development
6. Suggest resources, courses, and practical next steps
7. Be concise but thorough (aim for 150-300 words per response)

IMPORTANT DISCLAIMERS:
- Always state: "This is a suggestion based on current trends and your profile"
- Never guarantee job outcomes or success
- Encourage continuous learning and adaptation
- Promote inclusive and sustainable career development

When analyzing user skills:
- Match skills to realistic career roles
- Identify skill gaps and learning opportunities
- Suggest both technical and soft skills development
- Consider entry-level and growth opportunities

Format responses clearly with:
- Direct answers to questions
- Bullet points for lists
- Specific action steps when applicable
- Relevant skill or course recommendations`;

/**
 * Generate AI response from CareerBot
 * @param {string} userMessage - User's question
 * @param {Object} userProfile - User profile data (skills, experience, goals)
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} - AI response with suggestions
 */
export const generateCareerBotResponse = async (userMessage, userProfile = {}, conversationHistory = []) => {
  if (!userMessage || userMessage.trim().length === 0) {
    throw new Error('Please enter a question or message.');
  }

  try {
    // Build context from user profile
    const userContext = buildUserContext(userProfile);

    // Build conversation history for context
    const historyContext = conversationHistory.length > 0
      ? '\n\nCONVERSATION HISTORY:\n' + conversationHistory.slice(-6).map(msg => 
          `${msg.role === 'user' ? 'User' : 'CareerBot'}: ${msg.content}`
        ).join('\n')
      : '';

    // Create the full prompt
    const fullPrompt = `${SYSTEM_PROMPT}

${userContext}

${historyContext}

USER QUESTION:
${userMessage}

Provide a helpful, actionable response that addresses the user's question while considering their profile and career goals. Remember to include appropriate disclaimers about suggestions vs guarantees.`;

    // Use unified API provider with auto-fallback
    const result = await generateAIResponse(fullPrompt);

    return {
      success: true,
      response: result.response,
      provider: result.provider,
      model: result.model,
      timestamp: new Date().toISOString(),
      disclaimer: 'This is AI-generated career guidance. Outcomes may vary based on individual effort, market conditions, and other factors.',
    };

  } catch (error) {
    console.error('CareerBot API Error:', error);
    
    if (error.message && error.message.includes('API key')) {
      throw new Error('CareerBot is not configured. Please contact administrator.');
    }
    
    throw new Error(`CareerBot error: ${error.message}`);
  }
};

/**
 * Build user context string from profile data
 */
const buildUserContext = (userProfile) => {
  const parts = ['USER PROFILE:'];
  
  if (userProfile.name) {
    parts.push(`Name: ${userProfile.name}`);
  }
  
  if (userProfile.skills && userProfile.skills.length > 0) {
    parts.push(`Current Skills: ${userProfile.skills.join(', ')}`);
  }
  
  if (userProfile.basic?.DesiredSkill && userProfile.basic.DesiredSkill.length > 0) {
    parts.push(`Desired Skills: ${userProfile.basic.DesiredSkill.join(', ')}`);
  }
  
  if (userProfile.basic?.exp) {
    parts.push(`Experience Level: ${userProfile.basic.exp}`);
  }
  
  if (userProfile.basic?.age) {
    parts.push(`Age: ${userProfile.basic.age}`);
  }
  
  if (userProfile.careerGoals) {
    parts.push(`Career Goals: ${userProfile.careerGoals}`);
  }
  
  if (userProfile.basic?.location) {
    parts.push(`Location: ${userProfile.basic.location}`);
  }
  
  return parts.length > 1 ? parts.join('\n') : 'USER PROFILE: No profile information available';
};

/**
 * Get suggested questions based on user profile
 */
export const getSuggestedQuestions = (userProfile = {}) => {
  const hasSkills = userProfile.skills && userProfile.skills.length > 0;
  const hasDesiredSkills = userProfile.basic?.DesiredSkill && userProfile.basic.DesiredSkill.length > 0;
  const hasExperience = userProfile.basic?.exp;
  
  const questions = [
    {
      id: 'roles',
      text: 'Which career roles fit my current skills?',
      icon: '💼',
      category: 'Career Path',
      condition: hasSkills,
    },
    {
      id: 'learning',
      text: 'What should I learn next to achieve my career goals?',
      icon: '📚',
      category: 'Learning',
      condition: hasDesiredSkills || hasSkills,
    },
    {
      id: 'skills-gap',
      text: 'What skills am I missing for my target role?',
      icon: '🎯',
      category: 'Skill Development',
      condition: hasDesiredSkills,
    },
    {
      id: 'internship',
      text: 'How can I improve my chances of getting an internship?',
      icon: '🚀',
      category: 'Job Search',
      condition: !hasExperience || hasExperience === 'Entry Level',
    },
    {
      id: 'portfolio',
      text: 'What projects should I build to strengthen my portfolio?',
      icon: '🛠️',
      category: 'Portfolio',
      condition: hasSkills,
    },
    {
      id: 'transition',
      text: 'How do I transition into a different career field?',
      icon: '🔄',
      category: 'Career Change',
      condition: true,
    },
    {
      id: 'interview',
      text: 'How can I prepare for technical interviews?',
      icon: '💡',
      category: 'Interview Prep',
      condition: hasSkills,
    },
    {
      id: 'remote',
      text: 'How can I find remote work opportunities?',
      icon: '🌍',
      category: 'Remote Work',
      condition: true,
    },
  ];
  
  return questions.filter(q => q.condition !== false);
};

/**
 * Save conversation to Firestore for history
 */
export const saveConversation = async (userMessage, botResponse) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('No user logged in, conversation not saved');
    return null;
  }

  try {
    const conversationData = {
      userId: currentUser.uid,
      userMessage,
      botResponse: botResponse.response,
      timestamp: serverTimestamp(),
      disclaimer: botResponse.disclaimer,
    };

    const docRef = await addDoc(collection(db, 'careerbot_conversations'), conversationData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load recent conversation history
 */
export const loadConversationHistory = async (limitCount = 10) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  try {
    const q = query(
      collection(db, 'careerbot_conversations'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return conversations.reverse(); // Oldest first
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
};

/**
 * Validate and sanitize user input
 */
export const validateUserInput = (message) => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Please enter a valid message' };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > 500) {
    return { valid: false, error: 'Message is too long. Please keep it under 500 characters.' };
  }
  
  return { valid: true, message: trimmed };
};

/**
 * Quick response templates for common scenarios
 */
export const getQuickResponse = (scenario) => {
  const responses = {
    'no-profile': {
      message: "I'd love to help! To provide personalized career guidance, please complete your profile with your skills, experience, and career goals. This helps me give you more relevant advice.",
      action: 'complete-profile',
    },
    'no-api-key': {
      message: "CareerBot AI is currently unavailable. Please contact the administrator or try again later.",
      action: null,
    },
    'error': {
      message: "I encountered an error processing your request. Please try rephrasing your question or try again in a moment.",
      action: 'retry',
    },
  };
  
  return responses[scenario] || responses['error'];
};
