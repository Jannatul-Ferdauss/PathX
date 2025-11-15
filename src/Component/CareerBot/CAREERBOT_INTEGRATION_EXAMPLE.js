// CAREERBOT_INTEGRATION_EXAMPLE.js
// Example of how to integrate CareerBot service in other components

import {
  generateCareerBotResponse,
  getSuggestedQuestions,
  saveConversation,
  validateUserInput,
} from './Component/CareerBot/careerBotService';

/**
 * EXAMPLE 1: Quick Career Advice Widget
 * Embed a simple career advice widget in any component
 */
export const QuickAdviceWidget = ({ userProfile }) => {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const getQuickAdvice = async () => {
    setLoading(true);
    try {
      const response = await generateCareerBotResponse(
        'Give me one quick tip to improve my career based on my profile',
        userProfile,
        []
      );
      setAdvice(response.response);
    } catch (error) {
      console.error('Error getting advice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-advice-widget">
      <h3>💡 Quick Career Tip</h3>
      {loading ? (
        <p>Getting advice...</p>
      ) : (
        <>
          <p>{advice}</p>
          <button onClick={getQuickAdvice}>Get New Tip</button>
        </>
      )}
    </div>
  );
};

/**
 * EXAMPLE 2: Skill Gap Analysis
 * Add to profile page to show skill gaps
 */
export const SkillGapAnalysis = ({ userProfile }) => {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const analyzeSkills = async () => {
      if (!userProfile.skills || !userProfile.basic?.DesiredSkill) return;

      const prompt = `
        My current skills: ${userProfile.skills.join(', ')}
        My desired skills: ${userProfile.basic.DesiredSkill.join(', ')}
        My target role: ${userProfile.careerGoals}
        
        What are the most important skill gaps I should focus on?
        Provide a prioritized list with brief explanations.
      `;

      const response = await generateCareerBotResponse(prompt, userProfile, []);
      setAnalysis(response.response);
    };

    analyzeSkills();
  }, [userProfile]);

  return (
    <div className="skill-gap-analysis">
      <h3>🎯 Your Skill Gaps</h3>
      {analysis ? (
        <div className="analysis-content">{analysis}</div>
      ) : (
        <p>Analyzing your skills...</p>
      )}
    </div>
  );
};

/**
 * EXAMPLE 3: Job Application Assistant
 * Help users prepare for job applications
 */
export const JobApplicationHelper = ({ job, userProfile }) => {
  const [tips, setTips] = useState('');

  const getTipsForJob = async () => {
    const prompt = `
      I'm applying for: ${job.title} at ${job.company}
      Required skills: ${job.skills?.join(', ')}
      My skills: ${userProfile.skills.join(', ')}
      
      Give me 3 specific tips to strengthen my application for this role.
    `;

    const response = await generateCareerBotResponse(prompt, userProfile, []);
    setTips(response.response);
  };

  return (
    <div className="job-helper">
      <button onClick={getTipsForJob}>Get Application Tips</button>
      {tips && <div className="tips-content">{tips}</div>}
    </div>
  );
};

/**
 * EXAMPLE 4: Learning Path Recommender
 * Suggest next learning steps in course section
 */
export const LearningPathRecommender = ({ userProfile, completedCourses }) => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const getRecommendations = async () => {
      const prompt = `
        My current skills: ${userProfile.skills.join(', ')}
        Completed courses: ${completedCourses.map(c => c.title).join(', ')}
        My goal: ${userProfile.careerGoals}
        
        Suggest 3 specific courses or learning resources I should pursue next.
        Format as a numbered list.
      `;

      const response = await generateCareerBotResponse(prompt, userProfile, []);
      setRecommendations(response.response);
    };

    if (userProfile && completedCourses.length > 0) {
      getRecommendations();
    }
  }, [userProfile, completedCourses]);

  return (
    <div className="learning-path">
      <h3>📚 Recommended Next Steps</h3>
      <div className="recommendations">{recommendations}</div>
    </div>
  );
};

/**
 * EXAMPLE 5: Interview Prep Assistant
 * Generate interview questions for practice
 */
export const InterviewPrepHelper = ({ targetRole, userProfile }) => {
  const [questions, setQuestions] = useState([]);

  const generateQuestions = async () => {
    const prompt = `
      Target role: ${targetRole}
      My skills: ${userProfile.skills.join(', ')}
      
      Generate 5 technical interview questions I should prepare for this role.
      Include both technical and behavioral questions.
    `;

    const response = await generateCareerBotResponse(prompt, userProfile, []);
    setQuestions(response.response);
  };

  return (
    <div className="interview-prep">
      <h3>💡 Interview Practice</h3>
      <button onClick={generateQuestions}>Generate Questions</button>
      {questions && (
        <div className="questions-list">
          <p>{questions}</p>
        </div>
      )}
    </div>
  );
};

/**
 * EXAMPLE 6: Dashboard Career Insights
 * Show personalized insights on dashboard
 */
export const CareerInsightsCard = ({ userProfile }) => {
  const [insight, setInsight] = useState('');

  useEffect(() => {
    const getInsight = async () => {
      const prompt = `
        Based on my profile:
        - Skills: ${userProfile.skills.join(', ')}
        - Experience: ${userProfile.basic?.exp}
        - Goal: ${userProfile.careerGoals}
        
        Give me one actionable career insight or recommendation for this week.
        Keep it concise (2-3 sentences).
      `;

      const response = await generateCareerBotResponse(prompt, userProfile, []);
      setInsight(response.response);
    };

    getInsight();
  }, [userProfile]);

  return (
    <div className="career-insight-card">
      <h4>💼 This Week's Career Insight</h4>
      <p>{insight}</p>
      <button onClick={() => window.location.href = '/careerbot'}>
        Ask More Questions
      </button>
    </div>
  );
};

/**
 * EXAMPLE 7: Validate Input Before Sending
 * Always validate user input for safety
 */
export const SafeCareerBotInput = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    // Validate input
    const validation = validateUserInput(message);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Send message
    try {
      const response = await generateCareerBotResponse(
        validation.message,
        userProfile,
        []
      );
      // Handle response...
    } catch (err) {
      setError('Failed to get response');
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
      />
      {error && <p className="error">{error}</p>}
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

/**
 * EXAMPLE 8: Get Suggested Questions for Context
 * Show relevant questions based on user profile
 */
export const ContextualSuggestions = ({ userProfile }) => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const suggestions = getSuggestedQuestions(userProfile);
    setQuestions(suggestions);
  }, [userProfile]);

  return (
    <div className="contextual-suggestions">
      <h4>Questions You Might Ask:</h4>
      <ul>
        {questions.slice(0, 4).map(q => (
          <li key={q.id}>
            <span>{q.icon}</span> {q.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * EXAMPLE 9: Save Important Conversations
 * Save conversations for later reference
 */
export const SaveConversationButton = ({ userMessage, botResponse }) => {
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const result = await saveConversation(userMessage, botResponse);
    if (result.success) {
      setSaved(true);
    }
  };

  return (
    <button onClick={handleSave} disabled={saved}>
      {saved ? '✓ Saved' : '💾 Save This Advice'}
    </button>
  );
};

/**
 * EXAMPLE 10: Error Handling Pattern
 * Proper error handling for CareerBot integration
 */
export const SafeCareerBotIntegration = ({ userProfile }) => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const askCareerBot = async (question) => {
    setLoading(true);
    setError(null);

    try {
      // Validate input
      const validation = validateUserInput(question);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate response
      const result = await generateCareerBotResponse(
        validation.message,
        userProfile,
        []
      );

      setResponse(result);

      // Optionally save
      await saveConversation(question, result);

    } catch (err) {
      console.error('CareerBot error:', err);
      setError(err.message || 'Failed to get career advice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>Getting advice...</p>}
      {error && <p className="error">{error}</p>}
      {response && (
        <div className="response">
          <p>{response.response}</p>
          {response.disclaimer && (
            <p className="disclaimer">{response.disclaimer}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// INTEGRATION TIPS
// ============================================

/**
 * 1. ALWAYS validate user input before sending to API
 * 2. Handle errors gracefully with user-friendly messages
 * 3. Show loading states during API calls
 * 4. Include disclaimers with career advice
 * 5. Save important conversations for user history
 * 6. Use context-aware suggestions based on profile
 * 7. Keep responses concise and actionable
 * 8. Monitor API usage and costs
 * 9. Test with various user profiles
 * 10. Provide fallback content if API fails
 */

// ============================================
// BEST PRACTICES
// ============================================

/**
 * Profile Completeness:
 * - Encourage users to complete profiles for better advice
 * - Show warnings when profile is incomplete
 * - Guide users to add missing information
 * 
 * Performance:
 * - Cache responses when appropriate
 * - Limit conversation history to recent messages
 * - Debounce rapid API calls
 * 
 * User Experience:
 * - Show typing indicators during processing
 * - Auto-scroll to new messages
 * - Clear error messages
 * - Easy navigation to CareerBot
 * 
 * Safety:
 * - Always show disclaimers
 * - Sanitize user inputs
 * - Rate limit requests
 * - Monitor for inappropriate content
 */
