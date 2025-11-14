// cvAssistantService.js - AI-powered CV suggestions using Gemini API

import { GEMINI_CONFIG } from '../../config/geminiConfig';

/**
 * Generate CV suggestions using Google Gemini API
 * @param {Object} profile - User profile data
 * @returns {Promise<Object>} - AI-generated suggestions
 */
export async function generateCVSuggestions(profile) {
  if (!GEMINI_CONFIG.apiKey) {
    console.warn('Gemini API key not configured. Using fallback suggestions.');
    return generateFallbackSuggestions(profile);
  }

  try {
    const prompt = buildPrompt(profile);
    const response = await callGeminiAPI(prompt);
    return parseGeminiResponse(response, profile);
  } catch (error) {
    console.error('Error generating CV suggestions:', error);
    // Fallback to template-based suggestions
    return generateFallbackSuggestions(profile);
  }
}

/**
 * Build the prompt for Gemini API
 */
function buildPrompt(profile) {
  const { name, title, bio, skills, experiences, projects, education, basic } = profile;

  return `You are a professional career consultant and CV writer. Based on the following profile information, generate comprehensive CV improvement suggestions.

**Profile Information:**
- Name: ${name || 'Not provided'}
- Title: ${title || 'Not provided'}
- Current Summary: ${bio || 'Not provided'}
- Skills: ${skills && skills.length > 0 ? skills.join(', ') : 'Not provided'}
- Experience: ${basic?.exp || 'Not provided'}
- Location: ${basic?.location || 'Not provided'}

**Work Experience:**
${experiences && experiences.length > 0 
  ? experiences.map(exp => `- ${exp.role} at ${exp.company} (${exp.date}): ${exp.description || 'No description'}`).join('\n')
  : 'No work experience provided'}

**Projects:**
${projects && projects.length > 0
  ? projects.map(proj => `- ${proj.name} (${proj.tech}): ${proj.description || 'No description'}`).join('\n')
  : 'No projects provided'}

**Education:**
${education && education.length > 0
  ? education.map(edu => `- ${edu.degree} from ${edu.school} (${edu.date}): ${edu.description || 'No description'}`).join('\n')
  : 'No education provided'}

**Please provide the following:**

1. **Professional Summary**: Write a compelling 3-4 sentence professional summary that highlights key achievements and career goals. Make it ATS-friendly and impactful.

2. **Experience Bullet Points**: For each work experience, create 3-4 strong bullet points using the STAR method (Situation, Task, Action, Result). Focus on quantifiable achievements and action verbs.

3. **Project Descriptions**: For each project, create 2-3 bullet points that highlight technical skills, problem-solving, and impact.

4. **LinkedIn Optimization Tips**: Provide 5 specific recommendations for improving their LinkedIn profile.

5. **Portfolio Website Recommendations**: Provide 5 specific recommendations for creating or improving their online portfolio.

**Format your response as JSON with the following structure:**
{
  "professionalSummary": "string",
  "experienceBullets": [
    {
      "role": "string",
      "company": "string",
      "bullets": ["string", "string", "string"]
    }
  ],
  "projectBullets": [
    {
      "name": "string",
      "bullets": ["string", "string"]
    }
  ],
  "linkedInTips": ["string", "string", "string", "string", "string"],
  "portfolioTips": ["string", "string", "string", "string", "string"]
}

Ensure all bullet points start with strong action verbs and include specific, quantifiable results where possible.`;
}

/**
 * Call Gemini API
 */
async function callGeminiAPI(prompt) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.model}:generateContent?key=${GEMINI_CONFIG.apiKey}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Parse Gemini API response
 */
function parseGeminiResponse(response, profile) {
  try {
    const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content in response');
    }

    // Extract JSON from markdown code blocks if present
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const suggestions = JSON.parse(jsonStr);

    // Validate and sanitize the response
    return {
      professionalSummary: suggestions.professionalSummary || '',
      experienceBullets: Array.isArray(suggestions.experienceBullets) 
        ? suggestions.experienceBullets 
        : [],
      projectBullets: Array.isArray(suggestions.projectBullets)
        ? suggestions.projectBullets
        : [],
      linkedInTips: Array.isArray(suggestions.linkedInTips)
        ? suggestions.linkedInTips
        : [],
      portfolioTips: Array.isArray(suggestions.portfolioTips)
        ? suggestions.portfolioTips
        : []
    };
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    // Fallback to template-based suggestions
    return generateFallbackSuggestions(profile);
  }
}

/**
 * Generate fallback suggestions using templates (when AI is not available)
 */
function generateFallbackSuggestions(profile) {
  const { name, title, bio, skills, experiences, projects, basic } = profile;

  // Generate professional summary
  const professionalSummary = generateTemplateSummary(profile);

  // Generate experience bullets
  const experienceBullets = experiences && experiences.length > 0
    ? experiences.map(exp => ({
        role: exp.role || 'Position',
        company: exp.company || 'Company',
        bullets: generateExperienceBullets(exp)
      }))
    : [];

  // Generate project bullets
  const projectBullets = projects && projects.length > 0
    ? projects.map(proj => ({
        name: proj.name || 'Project',
        bullets: generateProjectBullets(proj)
      }))
    : [];

  // Generate LinkedIn tips
  const linkedInTips = [
    'Add a professional headshot with good lighting and a clean background',
    `Optimize your headline beyond just "${title || 'your title'}" - include key skills and value proposition`,
    'Write a compelling "About" section that tells your professional story and highlights achievements',
    'Request recommendations from colleagues, managers, and clients to build credibility',
    'Engage with content regularly - share insights, comment on posts, and publish articles in your field',
  ];

  // Generate portfolio tips
  const portfolioTips = [
    'Showcase 3-5 of your best projects with detailed case studies explaining your process',
    'Include before/after comparisons or metrics that demonstrate the impact of your work',
    'Make your portfolio mobile-responsive and fast-loading for optimal user experience',
    'Add clear calls-to-action and easy ways for potential employers to contact you',
    'Keep your portfolio updated regularly - remove outdated work and add recent achievements',
  ];

  return {
    professionalSummary,
    experienceBullets,
    projectBullets,
    linkedInTips,
    portfolioTips
  };
}

/**
 * Generate template-based professional summary
 */
function generateTemplateSummary(profile) {
  const { title, skills, basic, bio } = profile;
  
  if (bio && bio.trim().length > 50) {
    return bio;
  }

  const experience = basic?.exp || 'experienced';
  const topSkills = skills && skills.length > 0 
    ? skills.slice(0, 3).join(', ')
    : 'various technologies';

  return `${title || 'Professional'} with ${experience} of expertise in ${topSkills}. Proven track record of delivering high-quality solutions and collaborating effectively with cross-functional teams. Passionate about leveraging technology to solve complex problems and drive business value. Seeking opportunities to contribute technical expertise and innovative thinking to challenging projects.`;
}

/**
 * Generate template-based experience bullets
 */
function generateExperienceBullets(experience) {
  const bullets = [];
  const role = experience.role || 'position';
  const company = experience.company || 'company';

  if (experience.description && experience.description.trim().length > 20) {
    // If description exists, create bullets from it
    bullets.push(`Led key initiatives in ${role} role, driving project success and team collaboration`);
    bullets.push(`Implemented solutions that improved efficiency and contributed to ${company}'s objectives`);
    bullets.push(experience.description);
  } else {
    // Generic template bullets
    bullets.push(`Delivered high-impact projects as ${role}, collaborating with cross-functional teams`);
    bullets.push(`Improved processes and systems through innovative problem-solving and technical expertise`);
    bullets.push(`Contributed to team success by mentoring colleagues and sharing best practices`);
  }

  return bullets;
}

/**
 * Generate template-based project bullets
 */
function generateProjectBullets(project) {
  const bullets = [];
  const tech = project.tech || 'modern technologies';

  if (project.description && project.description.trim().length > 20) {
    bullets.push(`Developed using ${tech}, implementing best practices and clean code principles`);
    bullets.push(project.description);
  } else {
    bullets.push(`Built full-featured application using ${tech} with focus on user experience and performance`);
    bullets.push(`Implemented responsive design, optimized performance, and ensured cross-browser compatibility`);
  }

  return bullets;
}

/**
 * Generate suggestions for LinkedIn optimization
 */
export function generateLinkedInTips(profile) {
  const tips = [
    'Add a professional headshot with good lighting and a clean background',
    'Optimize your headline to include key skills and value proposition, not just your job title',
    'Write a compelling "About" section that tells your story and highlights key achievements',
    'Request recommendations from colleagues, managers, and clients',
    'Engage with content regularly - share insights, comment, and publish articles',
  ];

  // Customize based on profile
  if (!profile.avatar || profile.avatar.includes('pravatar')) {
    tips.push('Update your profile picture to a professional photo');
  }

  if (profile.skills && profile.skills.length > 5) {
    tips.push(`Showcase your ${profile.skills.length} skills in the skills section and get endorsements`);
  }

  return tips;
}

/**
 * Generate suggestions for portfolio website
 */
export function generatePortfolioTips(profile) {
  const tips = [
    'Showcase 3-5 of your best projects with detailed case studies',
    'Include metrics and results that demonstrate the impact of your work',
    'Ensure your portfolio is mobile-responsive and loads quickly',
    'Add clear calls-to-action and contact information',
    'Keep your portfolio updated with recent work and achievements',
  ];

  // Customize based on profile
  if (profile.projects && profile.projects.length > 0) {
    tips.push(`Feature your ${profile.projects.length} projects with screenshots, demos, and code samples`);
  }

  if (profile.skills && profile.skills.length > 0) {
    tips.push(`Create a dedicated skills section highlighting your proficiency in ${profile.skills.slice(0, 5).join(', ')}`);
  }

  return tips;
}
