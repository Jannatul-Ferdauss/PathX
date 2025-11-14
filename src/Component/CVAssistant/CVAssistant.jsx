import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './CVAssistant.css';
import { generateCVSuggestions } from './cvAssistantService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CVAssistant = ({ onClose, currentProfile }) => {
  const [profile, setProfile] = useState(currentProfile || null);
  const [loading, setLoading] = useState(!currentProfile);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [currentUser, setCurrentUser] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState(null);
  const cvPreviewRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentProfile && currentUser) {
      loadProfile();
    }
  }, [currentUser, currentProfile]);

  const loadProfile = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setLoading(false);
  };

  const handleGenerateSuggestions = async () => {
    if (!profile) return;
    
    setGenerating(true);
    try {
      const aiSuggestions = await generateCVSuggestions(profile);
      setSuggestions(aiSuggestions);
      setActiveTab('suggestions');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate AI suggestions. Please try again.');
    }
    setGenerating(false);
  };

  const downloadPDF = async () => {
    if (!cvPreviewRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(cvPreviewRef.current, {
        scale: 2,
        backgroundColor: '#0a0e27',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${profile.name || 'CV'}_Resume.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
    setExporting(false);
  };

  const printCV = () => {
    window.print();
  };

  const applyProfessionalSummary = async () => {
    if (!suggestions?.professionalSummary || !currentUser) return;
    
    setApplying(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        bio: suggestions.professionalSummary
      });
      
      setProfile(prev => ({ ...prev, bio: suggestions.professionalSummary }));
      setToast('✅ Professional summary applied to your profile!');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error applying summary:', error);
      setToast('❌ Failed to apply summary');
      setTimeout(() => setToast(null), 3000);
    }
    setApplying(false);
  };

  const applyExperienceBullets = async (experienceItem) => {
    if (!currentUser || !profile.experiences) return;
    
    setApplying(true);
    try {
      // Find matching experience and update its description
      const updatedExperiences = profile.experiences.map(exp => {
        if (exp.role === experienceItem.role || exp.company === experienceItem.company) {
          return {
            ...exp,
            description: experienceItem.bullets.map(b => `• ${b}`).join('\n')
          };
        }
        return exp;
      });
      
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        experiences: updatedExperiences
      });
      
      setProfile(prev => ({ ...prev, experiences: updatedExperiences }));
      setToast('✅ Experience bullets applied to your profile!');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error applying experience:', error);
      setToast('❌ Failed to apply experience bullets');
      setTimeout(() => setToast(null), 3000);
    }
    setApplying(false);
  };

  const applyProjectBullets = async (projectItem) => {
    if (!currentUser || !profile.projects) return;
    
    setApplying(true);
    try {
      // Find matching project and update its description
      const updatedProjects = profile.projects.map(proj => {
        if (proj.name === projectItem.name) {
          return {
            ...proj,
            description: projectItem.bullets.map(b => `• ${b}`).join('\n')
          };
        }
        return proj;
      });
      
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        projects: updatedProjects
      });
      
      setProfile(prev => ({ ...prev, projects: updatedProjects }));
      setToast('✅ Project bullets applied to your profile!');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error applying project:', error);
      setToast('❌ Failed to apply project bullets');
      setTimeout(() => setToast(null), 3000);
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="cv-assistant-overlay">
        <div className="cv-assistant-container">
          <div className="cv-loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="cv-assistant-overlay">
        <div className="cv-assistant-container">
          <div className="cv-loading">No profile data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-assistant-overlay">
      <div className="cv-assistant-container">
        {/* Header */}
        <div className="cv-header">
          <div className="cv-header-left">
            <h2>📄 CV Assistant</h2>
            <p>Generate, optimize, and export your professional CV</p>
          </div>
          <button className="cv-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Action Buttons */}
        <div className="cv-actions">
          <button 
            className={`cv-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Preview
          </button>
          <button 
            className={`cv-tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            🤖 AI Suggestions
          </button>
          <button 
            className="cv-generate-btn"
            onClick={handleGenerateSuggestions}
            disabled={generating}
          >
            {generating ? '⏳ Generating...' : '✨ Generate AI Suggestions'}
          </button>
          <button 
            className="cv-export-btn"
            onClick={downloadPDF}
            disabled={exporting}
          >
            {exporting ? '⏳ Downloading...' : '📥 Download PDF'}
          </button>
          <button 
            className="cv-print-btn"
            onClick={printCV}
          >
            🖨️ Print
          </button>
        </div>

        {/* Content Area */}
        <div className="cv-content">
          {activeTab === 'preview' && (
            <div className="cv-preview-wrapper">
              <CVPreview profile={profile} ref={cvPreviewRef} />
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="cv-suggestions-wrapper">
              {!suggestions ? (
                <div className="cv-suggestions-empty">
                  <div className="empty-icon">🤖</div>
                  <h3>AI-Powered CV Optimization</h3>
                  <p>Click "Generate AI Suggestions" to get personalized recommendations for:</p>
                  <ul>
                    <li>✨ Professional summary tailored to your experience</li>
                    <li>📝 Strong bullet points for your projects and experience</li>
                    <li>💼 LinkedIn profile optimization tips</li>
                    <li>🌐 Portfolio website recommendations</li>
                  </ul>
                </div>
              ) : (
                <CVSuggestions 
                  suggestions={suggestions} 
                  profile={profile}
                  onApplySummary={applyProfessionalSummary}
                  onApplyExperience={applyExperienceBullets}
                  onApplyProject={applyProjectBullets}
                  applying={applying}
                />
              )}
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="cv-toast">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};

// CV Preview Component
const CVPreview = React.forwardRef(({ profile }, ref) => {
  return (
    <div className="cv-preview" ref={ref}>
      {/* Header Section */}
      <div className="cv-preview-header">
        <div className="cv-preview-avatar">
          <img 
            src={profile.avatar || 'https://i.pravatar.cc/300?img=47'} 
            alt={profile.name || 'User'}
            onError={(e) => { e.target.src = 'https://i.pravatar.cc/300?img=47'; }}
          />
        </div>
        <div className="cv-preview-header-info">
          <h1>{profile.name || 'Your Name'}</h1>
          <h2>{profile.title || 'Professional Title'}</h2>
          <div className="cv-preview-contact">
            <span>{profile.basic?.location || 'Location'}</span>
            {profile.basic?.location && <span className="separator">•</span>}
            <span>{profile.basic?.availability || 'Availability'}</span>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="cv-preview-section">
        <h3>Professional Summary</h3>
        <p>{profile.bio || 'Add your professional summary in your profile.'}</p>
      </div>

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="cv-preview-section">
          <h3>Skills</h3>
          <div className="cv-preview-skills">
            {profile.skills.map((skill, idx) => (
              <span key={idx} className="cv-skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {profile.experiences && profile.experiences.length > 0 && (
        <div className="cv-preview-section">
          <h3>Work Experience</h3>
          {profile.experiences.map((exp) => (
            <div key={exp.id} className="cv-preview-item">
              <div className="cv-item-header">
                <div>
                  <h4>{exp.role || 'Role'}</h4>
                  <p className="cv-item-company">{exp.company || 'Company'}</p>
                </div>
                <div className="cv-item-date">{exp.date || 'Date'}</div>
              </div>
              {exp.location && <p className="cv-item-location">📍 {exp.location}</p>}
              {exp.description && <p className="cv-item-description">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {profile.projects && profile.projects.length > 0 && (
        <div className="cv-preview-section">
          <h3>Projects</h3>
          {profile.projects.map((project) => (
            <div key={project.id} className="cv-preview-item">
              <div className="cv-item-header">
                <div>
                  <h4>{project.name || 'Project Name'}</h4>
                  <p className="cv-item-company">{project.tech || 'Technologies'}</p>
                </div>
                <div className="cv-item-date">{project.date || 'Date'}</div>
              </div>
              {project.link && (
                <p className="cv-item-link">🔗 <a href={project.link} target="_blank" rel="noopener noreferrer">{project.link}</a></p>
              )}
              {project.description && <p className="cv-item-description">{project.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <div className="cv-preview-section">
          <h3>Education</h3>
          {profile.education.map((edu) => (
            <div key={edu.id} className="cv-preview-item">
              <div className="cv-item-header">
                <div>
                  <h4>{edu.degree || 'Degree'}</h4>
                  <p className="cv-item-company">{edu.school || 'School'}</p>
                </div>
                <div className="cv-item-date">{edu.date || 'Date'}</div>
              </div>
              {edu.location && <p className="cv-item-location">📍 {edu.location}</p>}
              {edu.description && <p className="cv-item-description">{edu.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// CV Suggestions Component
const CVSuggestions = ({ suggestions, profile, onApplySummary, onApplyExperience, onApplyProject, applying }) => {
  return (
    <div className="cv-suggestions">
      {/* Professional Summary Suggestions */}
      {suggestions.professionalSummary && (
        <div className="cv-suggestion-section">
          <div className="suggestion-header">
            <h3>✨ Professional Summary</h3>
            <span className="suggestion-badge">AI Generated</span>
          </div>
          <div className="suggestion-content">
            <p className="suggestion-text">{suggestions.professionalSummary}</p>
            <div className="suggestion-actions">
              <button 
                className="apply-btn"
                onClick={onApplySummary}
                disabled={applying}
              >
                ✨ Apply to Profile
              </button>
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(suggestions.professionalSummary);
                  alert('Copied to clipboard!');
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experience Bullet Points */}
      {suggestions.experienceBullets && suggestions.experienceBullets.length > 0 && (
        <div className="cv-suggestion-section">
          <div className="suggestion-header">
            <h3>💼 Enhanced Experience Bullet Points</h3>
            <span className="suggestion-badge">AI Generated</span>
          </div>
          {suggestions.experienceBullets.map((item, idx) => (
            <div key={idx} className="suggestion-content">
              <h4 className="suggestion-subtitle">{item.role || 'Experience'}</h4>
              <ul className="bullet-list">
                {item.bullets.map((bullet, bidx) => (
                  <li key={bidx}>{bullet}</li>
                ))}
              </ul>
              <div className="suggestion-actions">
                <button 
                  className="apply-btn"
                  onClick={() => onApplyExperience(item)}
                  disabled={applying}
                >
                  ✨ Apply to Profile
                </button>
                <button 
                  className="copy-btn"
                  onClick={() => {
                    const text = item.bullets.join('\n• ');
                    navigator.clipboard.writeText('• ' + text);
                    alert('Copied to clipboard!');
                  }}
                >
                  📋 Copy All
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Bullet Points */}
      {suggestions.projectBullets && suggestions.projectBullets.length > 0 && (
        <div className="cv-suggestion-section">
          <div className="suggestion-header">
            <h3>🚀 Enhanced Project Descriptions</h3>
            <span className="suggestion-badge">AI Generated</span>
          </div>
          {suggestions.projectBullets.map((item, idx) => (
            <div key={idx} className="suggestion-content">
              <h4 className="suggestion-subtitle">{item.name || 'Project'}</h4>
              <ul className="bullet-list">
                {item.bullets.map((bullet, bidx) => (
                  <li key={bidx}>{bullet}</li>
                ))}
              </ul>
              <div className="suggestion-actions">
                <button 
                  className="apply-btn"
                  onClick={() => onApplyProject(item)}
                  disabled={applying}
                >
                  ✨ Apply to Profile
                </button>
                <button 
                  className="copy-btn"
                  onClick={() => {
                    const text = item.bullets.join('\n• ');
                    navigator.clipboard.writeText('• ' + text);
                    alert('Copied to clipboard!');
                  }}
                >
                  📋 Copy All
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LinkedIn Recommendations */}
      {suggestions.linkedInTips && suggestions.linkedInTips.length > 0 && (
        <div className="cv-suggestion-section">
          <div className="suggestion-header">
            <h3>💼 LinkedIn Profile Optimization</h3>
            <span className="suggestion-badge">Recommendations</span>
          </div>
          <div className="suggestion-content">
            <ul className="recommendation-list">
              {suggestions.linkedInTips.map((tip, idx) => (
                <li key={idx}>
                  <span className="tip-icon">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Portfolio Recommendations */}
      {suggestions.portfolioTips && suggestions.portfolioTips.length > 0 && (
        <div className="cv-suggestion-section">
          <div className="suggestion-header">
            <h3>🌐 Portfolio Website Recommendations</h3>
            <span className="suggestion-badge">Recommendations</span>
          </div>
          <div className="suggestion-content">
            <ul className="recommendation-list">
              {suggestions.portfolioTips.map((tip, idx) => (
                <li key={idx}>
                  <span className="tip-icon">🎨</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVAssistant;
