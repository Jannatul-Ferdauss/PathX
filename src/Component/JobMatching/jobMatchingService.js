// Job Matching Service with Gemini 2.5 API Integration
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

/**
 * Calculate match percentage between user profile and job
 * @param {Object} userProfile - User's profile from Firebase
 * @param {Object} job - Job posting data
 * @returns {Object} Match result with score and reasons
 */
export const calculateJobMatch = async (userProfile, job) => {
  try {
    // Basic validation
    if (!userProfile || !job) {
      return { score: 0, reasons: [], missing: [] };
    }

    // Extract user data
    const userSkills = userProfile.skills || [];
    const userExperience = userProfile.basic?.exp || "0 years";
    const userInterests = userProfile.careerInterests || "";
    const userDesiredSkills = userProfile.basic?.DesiredSkill || [];

    // Extract job requirements
    const jobSkills = job.skills || [];
    const jobLevel = job.level || "";
    const jobTrack = job.track || "";

    // Calculate skill match
    const matchingSkills = userSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );

    const missingSkills = jobSkills.filter(skill => 
      !userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    // Calculate skill overlap percentage
    const skillMatchPercentage = jobSkills.length > 0
      ? (matchingSkills.length / jobSkills.length) * 100
      : 0;

    // Experience level matching
    let experienceScore = 0;
    const userYears = parseExperienceYears(userExperience);
    
    if (jobLevel.toLowerCase().includes("entry") || jobLevel.toLowerCase().includes("fresher")) {
      experienceScore = userYears <= 1 ? 100 : userYears <= 2 ? 80 : 60;
    } else if (jobLevel.toLowerCase().includes("mid") || jobLevel.toLowerCase().includes("intermediate")) {
      experienceScore = userYears >= 2 && userYears <= 5 ? 100 : userYears < 2 ? 70 : 80;
    } else if (jobLevel.toLowerCase().includes("senior")) {
      experienceScore = userYears >= 5 ? 100 : userYears >= 3 ? 70 : 40;
    } else {
      experienceScore = 70; // Default if level not specified
    }

    // Interest/Track alignment
    let interestScore = 0;
    if (jobTrack && userInterests) {
      const interestMatch = userInterests.toLowerCase().includes(jobTrack.toLowerCase()) ||
                           jobTrack.toLowerCase().includes(userInterests.toLowerCase());
      interestScore = interestMatch ? 100 : 50;
    } else {
      interestScore = 50; // Neutral if not specified
    }

    // Calculate weighted final score
    const finalScore = Math.round(
      (skillMatchPercentage * 0.6) + // 60% weight on skills
      (experienceScore * 0.25) +      // 25% weight on experience
      (interestScore * 0.15)          // 15% weight on interest
    );

    // Build reasons array
    const reasons = [];
    if (matchingSkills.length > 0) {
      reasons.push(`✓ Matches ${matchingSkills.length} skill${matchingSkills.length > 1 ? 's' : ''}: ${matchingSkills.slice(0, 3).join(", ")}${matchingSkills.length > 3 ? '...' : ''}`);
    }
    
    if (experienceScore >= 80) {
      reasons.push(`✓ Experience level aligns with ${jobLevel || 'job requirements'}`);
    } else if (experienceScore >= 60) {
      reasons.push(`⚠ Close to required experience level`);
    }

    if (interestScore === 100) {
      reasons.push(`✓ Matches your career interest in ${jobTrack}`);
    }

    if (missingSkills.length > 0 && missingSkills.length <= 5) {
      reasons.push(`✗ Missing: ${missingSkills.slice(0, 3).join(", ")}${missingSkills.length > 3 ? '...' : ''}`);
    }

    return {
      score: Math.min(finalScore, 100),
      reasons: reasons.length > 0 ? reasons : ["Basic profile match"],
      missing: missingSkills,
      matching: matchingSkills
    };

  } catch (error) {
    console.error("Error calculating job match:", error);
    return { score: 0, reasons: ["Error calculating match"], missing: [], matching: [] };
  }
};

/**
 * Get AI-powered job recommendations using GROQ
 * @param {Object} userProfile - User's profile
 * @param {Array} jobs - List of available jobs
 * @returns {Array} Enhanced jobs with AI insights
 */
export const getAIJobRecommendations = async (userProfile, jobs) => {
  try {
    if (!jobs || jobs.length === 0) return [];

    // Calculate matches for all jobs
    const jobsWithMatches = await Promise.all(
      jobs.map(async (job) => {
        const matchResult = await calculateJobMatch(userProfile, job);
        return {
          ...job,
          matchScore: matchResult.score,
          matchReasons: matchResult.reasons,
          missingSkills: matchResult.missing,
          matchingSkills: matchResult.matching
        };
      })
    );

    // Sort by match score
    jobsWithMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Get AI insights for top matches
    const topJobs = jobsWithMatches.slice(0, 10);
    
    try {
      const aiInsights = await getGeminiInsights(userProfile, topJobs);
      
      // Merge AI insights with match data
      return jobsWithMatches.map(job => {
        const insight = aiInsights.find(i => i.jobId === job.id);
        return {
          ...job,
          aiInsight: insight?.insight || null,
          careerGrowth: insight?.growth || null
        };
      });
    } catch (aiError) {
      console.error("AI insights failed, returning basic matches:", aiError);
      return jobsWithMatches;
    }

  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return jobs;
  }
};

/**
 * Get AI insights using Gemini 2.5 API
 * @param {Object} userProfile - User profile
 * @param {Array} topJobs - Top matching jobs
 * @returns {Array} AI insights for each job
 */
const getGeminiInsights = async (userProfile, topJobs) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a career advisor AI. Analyze the following user profile and job matches to provide brief, actionable insights.

User Profile:
- Skills: ${userProfile.skills?.join(", ") || "Not specified"}
- Experience: ${userProfile.basic?.exp || "Not specified"}
- Career Interests: ${userProfile.careerInterests || "Not specified"}

Top Job Matches (top 5):
${topJobs.slice(0, 5).map((job, idx) => `
${idx + 1}. ${job.title} at ${job.company}
   - Match Score: ${job.matchScore}%
   - Required Skills: ${job.skills?.join(", ") || "Not specified"}
   - Level: ${job.level || "Not specified"}
`).join("\n")}

For each job, provide:
1. A ONE-LINE insight (max 15 words) on why this job is a good fit or what to improve
2. Career growth potential (Low/Medium/High)

Format your response as JSON array:
[
  {
    "jobIndex": 0,
    "insight": "Your React skills match perfectly; learn TypeScript to excel",
    "growth": "High"
  },
  ...
]

Keep insights brief, specific, and actionable. Return ONLY valid JSON, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    if (!response) return [];

    // Clean response - remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleanedResponse);
    const insights = Array.isArray(parsed) ? parsed : (parsed.insights || parsed.jobs || []);

    return insights.map((insight, idx) => ({
      jobId: topJobs[insight.jobIndex || idx]?.id,
      insight: insight.insight || "Good match for your profile",
      growth: insight.growth || "Medium"
    }));

  } catch (error) {
    console.error("Gemini API error:", error);
    return [];
  }
};

/**
 * Parse experience string to years
 * @param {String} expString - Experience string (e.g., "2 years")
 * @returns {Number} Years of experience
 */
const parseExperienceYears = (expString) => {
  if (!expString) return 0;
  
  const match = expString.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    
    // Handle months
    if (expString.toLowerCase().includes("month")) {
      return num / 12;
    }
    
    return num;
  }
  
  // Handle text-based experience
  if (expString.toLowerCase().includes("fresher") || 
      expString.toLowerCase().includes("entry")) {
    return 0;
  }
  
  return 0;
};

/**
 * Get job platform suggestions based on job type and location
 * @param {Object} job - Job posting
 * @returns {Array} Platform suggestions with links
 */
export const getJobPlatforms = (job) => {
  const platforms = [];
  
  // LinkedIn - Universal
  platforms.push({
    name: "LinkedIn",
    icon: "💼",
    url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title || '')}&location=${encodeURIComponent(job.location || '')}`,
    color: "#0A66C2"
  });

  // BDjobs - Bangladesh specific
  if (job.location?.toLowerCase().includes("bangladesh") || 
      job.location?.toLowerCase().includes("dhaka")) {
    platforms.push({
      name: "BDjobs",
      icon: "🇧🇩",
      url: `https://jobs.bdjobs.com/jobsearch.asp?fcatId=&icatId=&jobTitle=${encodeURIComponent(job.title || '')}`,
      color: "#E31837"
    });
  }

  // Glassdoor
  platforms.push({
    name: "Glassdoor",
    icon: "🏢",
    url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(job.title || '')}&locT=C&locId=&jobType=`,
    color: "#0CAA41"
  });

  // Indeed
  platforms.push({
    name: "Indeed",
    icon: "🔍",
    url: `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title || '')}&l=${encodeURIComponent(job.location || '')}`,
    color: "#2164f3"
  });

  // For tech/remote jobs
  if (job.type?.toLowerCase().includes("remote") || 
      job.skills?.some(s => ["react", "javascript", "python", "java", "node"].includes(s.toLowerCase()))) {
    platforms.push({
      name: "RemoteOK",
      icon: "🌍",
      url: `https://remoteok.com/remote-${encodeURIComponent(job.title?.toLowerCase().replace(/\s+/g, '-') || 'jobs')}`,
      color: "#FF4742"
    });
  }

  // For freelance
  if (job.type?.toLowerCase().includes("freelance")) {
    platforms.push({
      name: "Upwork",
      icon: "💻",
      url: `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(job.title || '')}`,
      color: "#14A800"
    });
  }

  return platforms;
};

export default {
  calculateJobMatch,
  getAIJobRecommendations,
  getJobPlatforms,
  parseExperienceYears
};
