import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./jobs.css";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from '../Sidebar/Sidebar';
import { useLanguage } from '../../context/LanguageContext';
import { getAIJobRecommendations, getJobPlatforms } from "../JobMatching/jobMatchingService";
import { analyzeSkillGaps } from "../JobMatching/skillGapService";

export default function Jobs() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [matchingEnabled, setMatchingEnabled] = useState(false);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setUserProfile(null);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
          setMatchingEnabled(true);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, [currentUser]);

  // Fetch jobs from Firestore and calculate matches
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "jobs"));
        const jobsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // If user is logged in and has profile, calculate matches
        if (matchingEnabled && userProfile) {
          const jobsWithMatches = await getAIJobRecommendations(userProfile, jobsList);
          setJobs(jobsWithMatches);
        } else {
          setJobs(jobsList);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [matchingEnabled, userProfile]);

  const filteredJobs =
    filter === "All" ? jobs : jobs.filter((job) => job.type === filter);

  // Sort jobs by match score if available
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (a.matchScore !== undefined && b.matchScore !== undefined) {
      return b.matchScore - a.matchScore;
    }
    return 0;
  });

  // Get match score color
  const getMatchColor = (score) => {
    if (score >= 75) return "#10b981"; // Green
    if (score >= 50) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  if (loading) return <p style={{ padding: "2rem", color: "#e4e6eb" }}>{t('common.loading')}</p>;

  return (
    <div
      style={{
        display: "flex",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        background: "#0a0e27",
      }}
    >
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <div className="jobs-page">
          <h1>{t('jobs.title')}</h1>

          {/* Filter Buttons */}
          <div className="filter-bar">
            {[
              { value: "All", label: t('jobs.filters.allTypes') },
              { value: "Internship", label: "Internship" },
              { value: "Part-time", label: t('jobs.filters.partTime') },
              { value: "Full-time", label: t('jobs.filters.fullTime') },
              { value: "Freelance", label: "Freelance" }
            ].map((f) => (
              <button
                key={f.value}
                className={filter === f.value ? "active" : ""}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Job Grid */}
          <div className="jobs-grid">
            {sortedJobs.length === 0 ? (
              <p style={{ color: "#a5b4fc", textAlign: "center" }}>{t('jobs.noResults')}</p>
            ) : (
              sortedJobs.map((job) => (
                <div
                  className="job-card"
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setSkillGapAnalysis(null); // Reset analysis for new job
                  }}
                >
                  {/* Match Score Badge */}
                  {job.matchScore !== undefined && (
                    <div 
                      className="match-badge" 
                      style={{ 
                        background: `linear-gradient(135deg, ${getMatchColor(job.matchScore)}, ${getMatchColor(job.matchScore)}dd)`,
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        zIndex: 2
                      }}
                    >
                      {job.matchScore}% {t('jobs.matchScore')}
                    </div>
                  )}
                  
                  <div className="job-summary">
                    {job.logo && (
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="company-logo"
                      />
                    )}
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                    
                    {/* Quick match indicators */}
                    {job.matchingSkills && job.matchingSkills.length > 0 && (
                      <div className="quick-match" style={{ marginTop: "8px", fontSize: "0.75rem" }}>
                        <span style={{ color: "#10b981" }}>✓</span> {job.matchingSkills.slice(0, 2).join(", ")}
                        {job.matchingSkills.length > 2 && ` +${job.matchingSkills.length - 2}`}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Job Modal */}
          {selectedJob && (
            <div
              className="modal-backdrop"
              onClick={() => {
                setSelectedJob(null);
                setSkillGapAnalysis(null); // Reset when closing
              }}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Match Score Header */}
                {selectedJob.matchScore !== undefined && (
                  <div 
                    className="match-header" 
                    style={{
                      background: `linear-gradient(135deg, ${getMatchColor(selectedJob.matchScore)}20, ${getMatchColor(selectedJob.matchScore)}10)`,
                      padding: "16px",
                      borderRadius: "12px",
                      marginBottom: "20px",
                      border: `2px solid ${getMatchColor(selectedJob.matchScore)}40`
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#e4e6eb" }}>
                          Match Score
                        </h3>
                        <div style={{ 
                          fontSize: "2.5rem", 
                          fontWeight: "800", 
                          color: getMatchColor(selectedJob.matchScore),
                          marginTop: "4px"
                        }}>
                          {selectedJob.matchScore}%
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {selectedJob.aiInsight && (
                          <p style={{ 
                            margin: 0, 
                            fontSize: "0.85rem", 
                            color: "#a5b4fc",
                            fontStyle: "italic",
                            maxWidth: "200px"
                          }}>
                            💡 {selectedJob.aiInsight}
                          </p>
                        )}
                        {selectedJob.careerGrowth && (
                          <p style={{ 
                            margin: "8px 0 0 0", 
                            fontSize: "0.8rem", 
                            color: "#18E7F5",
                            fontWeight: "600"
                          }}>
                            Career Growth: {selectedJob.careerGrowth}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Match Reasons */}
                    {selectedJob.matchReasons && selectedJob.matchReasons.length > 0 && (
                      <div style={{ marginTop: "16px" }}>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#a5b4fc" }}>
                          Why this match?
                        </h4>
                        <ul style={{ 
                          margin: 0, 
                          padding: "0 0 0 20px", 
                          fontSize: "0.85rem",
                          color: "#e4e6eb",
                          lineHeight: "1.6"
                        }}>
                          {selectedJob.matchReasons.map((reason, idx) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <h2>{selectedJob.title}</h2>
                <p>
                  <strong>Company:</strong> {selectedJob.company}
                </p>
                <p>
                  <strong>Location:</strong> {selectedJob.location}
                </p>
                {selectedJob.skills && (
                  <div style={{ marginBottom: "12px" }}>
                    <strong>Required Skills:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                      {selectedJob.skills.map((skill, idx) => {
                        const isMatching = selectedJob.matchingSkills?.includes(skill);
                        return (
                          <span
                            key={idx}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              background: isMatching 
                                ? "linear-gradient(135deg, #10b98130, #10b98120)" 
                                : "rgba(239, 68, 68, 0.15)",
                              border: isMatching 
                                ? "1px solid #10b98150" 
                                : "1px solid rgba(239, 68, 68, 0.3)",
                              color: isMatching ? "#10b981" : "#ef4444"
                            }}
                          >
                            {isMatching ? "✓" : "✗"} {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p>
                  <strong>Experience:</strong> {selectedJob.level}
                </p>
                <button
                  className={`job-type-btn ${selectedJob.type?.toLowerCase()}`}
                >
                  {selectedJob.type}
                </button>
                <p style={{ marginTop: "16px", lineHeight: "1.6" }}>{selectedJob.description}</p>
                
                {/* Skill Gap Analysis Section */}
                {selectedJob.missingSkills && selectedJob.missingSkills.length > 0 && (
                  <div style={{ marginTop: "24px" }}>
                    <div style={{
                      background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1))",
                      border: "2px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "12px",
                      padding: "16px",
                    }}>
                      <h4 style={{ margin: "0 0 12px 0", color: "#ef4444", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        📚 Skill Gap Analysis
                      </h4>
                      
                      {!skillGapAnalysis && !analyzingGaps && (
                        <button
                          onClick={async () => {
                            setAnalyzingGaps(true);
                            const analysis = await analyzeSkillGaps(
                              selectedJob.missingSkills,
                              userProfile,
                              selectedJob
                            );
                            setSkillGapAnalysis(analysis);
                            setAnalyzingGaps(false);
                          }}
                          style={{
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            transition: "all 0.3s ease"
                          }}
                        >
                          🎯 Get Learning Recommendations
                        </button>
                      )}
                      
                      {analyzingGaps && (
                        <p style={{ color: "#a5b4fc", fontSize: "0.85rem", margin: 0 }}>
                          🤖 AI analyzing your skill gaps...
                        </p>
                      )}
                      
                      {skillGapAnalysis && (
                        <div>
                          {/* AI Summary */}
                          {skillGapAnalysis.aiSummary && (
                            <div style={{
                              background: "rgba(99, 102, 241, 0.1)",
                              border: "1px solid rgba(99, 102, 241, 0.3)",
                              borderRadius: "8px",
                              padding: "12px",
                              marginBottom: "16px"
                            }}>
                              <p style={{ margin: 0, color: "#a5b4fc", fontSize: "0.85rem", fontStyle: "italic" }}>
                                💡 <strong>AI Insight:</strong> {skillGapAnalysis.aiSummary}
                              </p>
                            </div>
                          )}
                          
                          {/* Learning Path */}
                          {skillGapAnalysis.learningPath && (
                            <div style={{
                              background: "rgba(16, 185, 129, 0.1)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              borderRadius: "8px",
                              padding: "12px",
                              marginBottom: "16px"
                            }}>
                              <p style={{ margin: 0, color: "#10b981", fontSize: "0.85rem" }}>
                                🎯 <strong>Recommended Path:</strong> {skillGapAnalysis.learningPath}
                              </p>
                            </div>
                          )}
                          
                          {/* Skills with Courses */}
                          {skillGapAnalysis.gaps && skillGapAnalysis.gaps.length > 0 && (
                            <div>
                              <h5 style={{ margin: "0 0 12px 0", color: "#e4e6eb", fontSize: "0.9rem" }}>
                                Missing Skills & Resources:
                              </h5>
                              {skillGapAnalysis.gaps.map((gap, idx) => (
                                <div key={idx} style={{
                                  background: "rgba(26, 31, 58, 0.6)",
                                  border: "1px solid rgba(99, 102, 241, 0.2)",
                                  borderRadius: "8px",
                                  padding: "12px",
                                  marginBottom: "12px"
                                }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                                    <h6 style={{ margin: 0, color: "#ef4444", fontSize: "0.9rem", fontWeight: "700" }}>
                                      ✗ {gap.skill}
                                    </h6>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                      <span style={{
                                        background: gap.priority === "High" 
                                          ? "rgba(239, 68, 68, 0.2)"
                                          : gap.priority === "Medium"
                                          ? "rgba(249, 115, 22, 0.2)"
                                          : "rgba(107, 114, 128, 0.2)",
                                        color: gap.priority === "High" 
                                          ? "#ef4444"
                                          : gap.priority === "Medium"
                                          ? "#f97316"
                                          : "#9ca3af",
                                        padding: "2px 8px",
                                        borderRadius: "8px",
                                        fontSize: "0.7rem",
                                        fontWeight: "600"
                                      }}>
                                        {gap.priority} Priority
                                      </span>
                                      <span style={{
                                        color: "#a5b4fc",
                                        fontSize: "0.75rem"
                                      }}>
                                        ⏱ {gap.learningTime}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {gap.aiInsight && (
                                    <p style={{ margin: "0 0 12px 0", color: "#a5b4fc", fontSize: "0.8rem", fontStyle: "italic" }}>
                                      {gap.aiInsight}
                                    </p>
                                  )}
                                  
                                  {gap.courses && gap.courses.length > 0 ? (
                                    <div>
                                      <p style={{ margin: "0 0 8px 0", color: "#e4e6eb", fontSize: "0.8rem", fontWeight: "600" }}>
                                        📖 Recommended Courses:
                                      </p>
                                      {gap.courses.map((course, cIdx) => (
                                        <div key={cIdx} style={{
                                          background: "rgba(99, 102, 241, 0.1)",
                                          border: "1px solid rgba(99, 102, 241, 0.2)",
                                          borderRadius: "6px",
                                          padding: "8px 10px",
                                          marginBottom: "6px"
                                        }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                            <div style={{ flex: 1 }}>
                                              <a 
                                                href={course.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                  color: "#6366f1",
                                                  fontSize: "0.85rem",
                                                  fontWeight: "600",
                                                  textDecoration: "none",
                                                  display: "block",
                                                  marginBottom: "4px"
                                                }}
                                              >
                                                {course.title} →
                                              </a>
                                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                <span style={{ color: "#a5b4fc", fontSize: "0.75rem" }}>
                                                  {course.platform}
                                                </span>
                                                <span style={{
                                                  background: course.costIndicator === "Free"
                                                    ? "rgba(16, 185, 129, 0.2)"
                                                    : "rgba(249, 115, 22, 0.2)",
                                                  color: course.costIndicator === "Free"
                                                    ? "#10b981"
                                                    : "#f97316",
                                                  padding: "2px 6px",
                                                  borderRadius: "6px",
                                                  fontSize: "0.7rem",
                                                  fontWeight: "600"
                                                }}>
                                                  {course.costIndicator}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p style={{ margin: 0, color: "#6b7280", fontSize: "0.75rem", fontStyle: "italic" }}>
                                      No courses found. Try adding "{gap.skill}" to your desired skills for recommendations.
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Platform Links */}
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#e4e6eb", fontSize: "1rem" }}>
                    🔍 Find this job on:
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {getJobPlatforms(selectedJob).map((platform, idx) => (
                      <a
                        key={idx}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="platform-btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          background: `${platform.color}20`,
                          border: `2px solid ${platform.color}40`,
                          color: platform.color,
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = platform.color;
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = `0 6px 20px ${platform.color}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${platform.color}20`;
                          e.currentTarget.style.color = platform.color;
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <span>{platform.icon}</span>
                        <span>{platform.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
                
                <button
                  className="close-btn"
                  onClick={() => {
                    setSelectedJob(null);
                    setSkillGapAnalysis(null); // Reset when closing
                  }}
                  style={{ marginTop: "20px" }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
