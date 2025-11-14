// Skill Gap Analysis Service with Learning Resource Recommendations
import { GoogleGenerativeAI } from "@google/generative-ai";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

/**
 * Analyze skill gaps and recommend learning resources
 * @param {Array} missingSkills - Skills the user is missing for a job
 * @param {Object} userProfile - User's profile
 * @param {Object} job - Job details
 * @returns {Object} Skill gap analysis with course recommendations
 */
export const analyzeSkillGaps = async (missingSkills, userProfile, job) => {
  try {
    if (!missingSkills || missingSkills.length === 0) {
      return {
        gaps: [],
        recommendations: [],
        aiSummary: "You have all required skills for this job!"
      };
    }

    // Fetch relevant courses from Firebase for missing skills
    const relevantCourses = await fetchCoursesForSkills(missingSkills);

    // Get AI-powered learning path and recommendations
    const aiAnalysis = await getGeminiSkillGapAnalysis(
      missingSkills,
      userProfile,
      job,
      relevantCourses
    );

    // Match courses to specific skills
    const skillGapDetails = missingSkills.map(skill => {
      const matchingCourses = relevantCourses.filter(course =>
        course.relatedSkills?.some(s =>
          s.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(s.toLowerCase())
        )
      );

      // Get AI recommendation for this specific skill
      const aiRec = aiAnalysis.skillRecommendations?.find(rec =>
        rec.skill?.toLowerCase() === skill.toLowerCase()
      );

      return {
        skill,
        courses: matchingCourses.slice(0, 3), // Top 3 courses per skill
        priority: aiRec?.priority || "Medium",
        learningTime: aiRec?.estimatedTime || "2-4 weeks",
        aiInsight: aiRec?.insight || `Essential for ${job.title} role`
      };
    });

    return {
      gaps: skillGapDetails,
      allRecommendations: relevantCourses,
      aiSummary: aiAnalysis.summary || "Focus on learning these skills to improve your match",
      learningPath: aiAnalysis.learningPath || null
    };

  } catch (error) {
    console.error("Error analyzing skill gaps:", error);
    return {
      gaps: missingSkills.map(skill => ({ skill, courses: [], priority: "Medium" })),
      recommendations: [],
      aiSummary: "Learn these skills to become a better match for this job"
    };
  }
};

/**
 * Fetch courses from Firebase that teach the missing skills
 */
const fetchCoursesForSkills = async (skills) => {
  try {
    const coursesRef = collection(db, "courses");
    const coursesSnapshot = await getDocs(coursesRef);
    
    const allCourses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter courses that match any of the missing skills
    const relevantCourses = allCourses.filter(course =>
      course.relatedSkills?.some(courseSkill =>
        skills.some(missingSkill =>
          courseSkill.toLowerCase().includes(missingSkill.toLowerCase()) ||
          missingSkill.toLowerCase().includes(courseSkill.toLowerCase())
        )
      )
    );

    return relevantCourses;

  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

/**
 * Get AI-powered skill gap analysis and learning recommendations
 */
const getGeminiSkillGapAnalysis = async (missingSkills, userProfile, job, courses) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You are a career development AI. Analyze skill gaps for a job application.

Job: ${job.title} at ${job.company}
Missing Skills: ${missingSkills.join(", ")}

User Profile:
- Current Skills: ${userProfile.skills?.join(", ") || "Beginner"}
- Experience: ${userProfile.basic?.exp || "0 years"}
- Career Interest: ${userProfile.careerInterests || "Not specified"}

Available Learning Resources (top 6):
${courses.slice(0, 6).map((c, i) => `
${i + 1}. ${c.title} (${c.platform})
   - Teaches: ${c.relatedSkills?.join(", ")}
   - Cost: ${c.costIndicator}
`).join("\n")}

Provide:
1. For EACH missing skill:
   - Priority (High/Medium/Low) based on job importance
   - Estimated learning time (e.g., "2-4 weeks")
   - ONE-LINE insight (max 12 words)

2. Learning path order (which skills to learn first)
3. Overall strategy summary (max 25 words)

Return ONLY valid JSON:
{
  "skillRecommendations": [
    {
      "skill": "TypeScript",
      "priority": "High",
      "estimatedTime": "3-4 weeks",
      "insight": "Critical for modern React development; learn after JavaScript"
    },
    ...
  ],
  "learningPath": "Start with JavaScript fundamentals, then TypeScript, finally Redux for state management",
  "summary": "Focus on TypeScript first; it's most critical for this role"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    if (!response) return { skillRecommendations: [], summary: null };

    // Clean response
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleanedResponse);
    
    return {
      skillRecommendations: parsed.skillRecommendations || [],
      learningPath: parsed.learningPath || null,
      summary: parsed.summary || null
    };

  } catch (error) {
    console.error("Gemini API error for skill gaps:", error);
    return {
      skillRecommendations: missingSkills.map(skill => ({
        skill,
        priority: "Medium",
        estimatedTime: "2-4 weeks",
        insight: "Important skill for this role"
      })),
      summary: "Learn these skills to improve your job match"
    };
  }
};

/**
 * Get learning resources summary for quick display
 */
export const getQuickResourceRecommendations = (skillGaps) => {
  const resourcesBySkill = {};
  
  skillGaps.gaps?.forEach(gap => {
    resourcesBySkill[gap.skill] = {
      courses: gap.courses.map(c => ({
        title: c.title,
        platform: c.platform,
        url: c.url,
        cost: c.costIndicator
      })),
      priority: gap.priority,
      learningTime: gap.learningTime
    };
  });

  return resourcesBySkill;
};

export default {
  analyzeSkillGaps,
  getQuickResourceRecommendations
};
