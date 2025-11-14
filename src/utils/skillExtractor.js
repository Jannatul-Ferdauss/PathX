// skillExtractor.js - Smart Skill Extraction using Gemini AI
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from '../config/geminiConfig';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(GEMINI_CONFIG.apiKey);

/**
 * Extract text from CV file (TXT files only)
 * @param {File} file - The CV file
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // For .txt files only
        if (file.name.endsWith('.txt')) {
          resolve(e.target.result);
        } else {
          reject(new Error('Only .txt files are supported. Please upload a text file or paste content directly.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Extract skills from CV text using Gemini AI
 * @param {string} cvText - The CV content as text
 * @returns {Promise<Object>} - Extracted skills, roles, and domains
 */
export const extractSkillsWithGemini = async (cvText) => {
  if (!GEMINI_CONFIG.apiKey) {
    throw new Error('Gemini API key not configured. Please add REACT_APP_GEMINI_API_KEY to .env file');
  }

  if (!cvText || cvText.trim().length === 0) {
    throw new Error('CV text is empty. Please provide valid CV content.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_CONFIG.model });

    // Crafted prompt for skill extraction
    const prompt = `You are an expert CV/Resume analyzer. Extract skills and relevant information from the following CV text.

TASK: Analyze the CV and extract:
1. Technical Skills (programming languages, frameworks, tools, libraries)
2. Professional Skills (soft skills, methodologies)
3. Tools & Technologies (specific tools, platforms, software)
4. Roles/Domains (job roles, industries, specializations)

CV TEXT:
${cvText}

Respond in JSON format exactly like this (no markdown, just JSON):
{
  "technicalSkills": ["skill1", "skill2", ...],
  "professionalSkills": ["skill1", "skill2", ...],
  "tools": ["tool1", "tool2", ...],
  "roles": ["role1", "role2", ...],
  "domains": ["domain1", "domain2", ...],
  "summary": "A brief summary of the candidate's expertise (1-2 sentences)"
}

IMPORTANT:
- Include only skills explicitly mentioned or strongly implied in the CV
- Remove duplicates
- Use consistent capitalization (e.g., "React", "Node.js", "SQL")
- Maximum 5-8 items per category
- Be specific and accurate`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let extractedData = JSON.parse(responseText);

    // Ensure all fields are present and are arrays
    extractedData = {
      technicalSkills: Array.isArray(extractedData.technicalSkills) ? extractedData.technicalSkills : [],
      professionalSkills: Array.isArray(extractedData.professionalSkills) ? extractedData.professionalSkills : [],
      tools: Array.isArray(extractedData.tools) ? extractedData.tools : [],
      roles: Array.isArray(extractedData.roles) ? extractedData.roles : [],
      domains: Array.isArray(extractedData.domains) ? extractedData.domains : [],
      summary: extractedData.summary || 'No summary available',
    };

    return {
      success: true,
      data: extractedData,
      allSkills: [
        ...extractedData.technicalSkills,
        ...extractedData.professionalSkills,
        ...extractedData.tools,
      ],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    if (error.message && error.message.includes('JSON.parse')) {
      throw new Error('Failed to parse AI response. Please try again.');
    }
    
    throw new Error(`Skill extraction failed: ${error.message}`);
  }
};

/**
 * Alternative: Keyword-based skill extraction (fallback if Gemini fails)
 * Uses predefined skill dictionary
 * @param {string} cvText - The CV content
 * @returns {Object} - Extracted skills using heuristics
 */
export const extractSkillsWithKeywords = (cvText) => {
  const lowerText = cvText.toLowerCase();

  // Predefined skill dictionary
  const skillDictionary = {
    technicalSkills: [
      'javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'kotlin', 'ruby', 'php', 'go', 'rust', 'swift',
      'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring', 'fastapi',
      'sql', 'mysql', 'postgresql', 'mongodb', 'firebase', 'redis', 'graphql', 'rest api',
      'html', 'css', 'bootstrap', 'tailwind', 'sass', 'webpack', 'npm', 'git', 'docker', 'kubernetes',
      'aws', 'azure', 'gcp', 'cloud', 'machine learning', 'ai', 'nlp', 'deep learning', 'tensorflow', 'pytorch',
    ],
    professionalSkills: [
      'communication', 'teamwork', 'leadership', 'problem solving', 'project management', 'agile', 'scrum',
      'analytical', 'creative', 'attention to detail', 'time management', 'critical thinking',
    ],
    tools: [
      'vscode', 'git', 'github', 'gitlab', 'jira', 'jenkins', 'docker', 'postman', 'figma', 'slack',
      'confluence', 'trello', 'notion', 'linux', 'windows', 'macos',
    ],
  };

  const foundSkills = {
    technicalSkills: [],
    professionalSkills: [],
    tools: [],
    roles: [],
    domains: [],
  };

  // Extract matching skills
  for (const [category, skills] of Object.entries(skillDictionary)) {
    for (const skill of skills) {
      if (lowerText.includes(skill) && !foundSkills[category].includes(skill)) {
        foundSkills[category].push(skill);
      }
    }
  }

  // Extract potential roles (simple heuristic)
  const rolePatterns = [
    { pattern: /frontend|ui\s*\/\s*ux|web developer/, role: 'Frontend Developer' },
    { pattern: /backend|server|api|database/, role: 'Backend Developer' },
    { pattern: /full\s*-?\s*stack|full stack/, role: 'Full Stack Developer' },
    { pattern: /data scientist|data analysis|analyst/, role: 'Data Scientist' },
    { pattern: /devops|infrastructure|deployment/, role: 'DevOps Engineer' },
    { pattern: /ml|machine learning|ai engineer/, role: 'ML Engineer' },
  ];

  for (const { pattern, role } of rolePatterns) {
    if (pattern.test(lowerText) && !foundSkills.roles.includes(role)) {
      foundSkills.roles.push(role);
    }
  }

  return {
    success: true,
    data: foundSkills,
    allSkills: [
      ...foundSkills.technicalSkills,
      ...foundSkills.professionalSkills,
      ...foundSkills.tools,
    ],
    method: 'keyword-based',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Main function: Extract skills from CV using Gemini, fallback to keywords if needed
 * @param {string} cvText - CV content
 * @returns {Promise<Object>} - Extraction result
 */
export const extractSkills = async (cvText) => {
  try {
    // Try Gemini extraction first
    return await extractSkillsWithGemini(cvText);
  } catch (error) {
    console.warn('⚠️ Gemini extraction failed, falling back to keyword-based extraction:', error.message);
    
    // Fallback to keyword-based extraction
    try {
      const keywordResult = extractSkillsWithKeywords(cvText);
      return {
        ...keywordResult,
        warning: 'AI extraction unavailable. Using keyword-based extraction instead.',
      };
    } catch (fallbackError) {
      throw new Error(`Both extraction methods failed: ${fallbackError.message}`);
    }
  }
};

/**
 * Merge extracted skills with existing profile skills
 * Avoids duplicates and returns deduplicated list
 * @param {Array<string>} existingSkills - Current profile skills
 * @param {Array<string>} newSkills - Newly extracted skills
 * @returns {Array<string>} - Merged skills without duplicates
 */
export const mergeSkills = (existingSkills = [], newSkills = []) => {
  const merged = new Set([
    ...(Array.isArray(existingSkills) ? existingSkills : []),
    ...(Array.isArray(newSkills) ? newSkills : []),
  ]);
  return Array.from(merged);
};
