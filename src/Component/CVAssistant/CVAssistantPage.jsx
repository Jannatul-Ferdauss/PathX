import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Sidebar from '../Sidebar/Sidebar';
import './CVAssistant.css';
import { generateCVSuggestions } from './cvAssistantService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CVAssistantPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
      if (!user) {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  const loadProfile = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        setToast('❌ No profile found. Please complete your profile first.');
        setTimeout(() => navigate('/ProfilePage'), 2000);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setToast('❌ Error loading profile');
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
      setToast('✅ AI suggestions generated!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setToast('❌ Failed to generate AI suggestions. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
    setGenerating(false);
  };

  const downloadPDF = async () => {
    if (!cvPreviewRef.current) return;
    
    setExporting(true);
    setToast('📥 Preparing PDF...');
    try {
      const canvas = await html2canvas(cvPreviewRef.current, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
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
      
      setToast('✅ PDF downloaded successfully!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setToast('❌ Failed to download PDF. Please try again.');
      setTimeout(() => setToast(null), 3000);
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
      <div style={{ display: 'flex', fontFamily: 'sans-serif', background: '#0a0e27', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e4e6eb' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
            <div style={{ fontSize: '18px' }}>Loading your profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', fontFamily: 'sans-serif', background: '#0a0e27', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e4e6eb' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <div style={{ fontSize: '18px' }}>No profile data available</div>
            <button 
              onClick={() => navigate('/ProfilePage')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', fontFamily: 'Inter, system-ui, sans-serif', background: '#0a0e27', minHeight: '100vh' }}>
      <Sidebar />
      
      <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#e4e6eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                📄 CV Assistant
              </h1>
              <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#a5b4fc' }}>
                Generate, optimize, and export your professional CV
              </p>
            </div>
            <button 
              onClick={() => navigate('/ProfilePage')}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: '#6366f1',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Back to Profile
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          marginBottom: '24px',
          padding: '20px',
          background: '#1a1f3a',
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <button 
            style={{
              padding: '12px 20px',
              background: activeTab === 'preview' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
              color: activeTab === 'preview' ? 'white' : '#a5b4fc',
              border: activeTab === 'preview' ? 'none' : '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Preview
          </button>
          <button 
            style={{
              padding: '12px 20px',
              background: activeTab === 'suggestions' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
              color: activeTab === 'suggestions' ? 'white' : '#a5b4fc',
              border: activeTab === 'suggestions' ? 'none' : '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTab('suggestions')}
          >
            🤖 AI Suggestions
          </button>
          <button 
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 26px rgba(16, 185, 129, 0.4)',
              marginLeft: 'auto'
            }}
            onClick={handleGenerateSuggestions}
            disabled={generating}
          >
            {generating ? '⏳ Generating...' : '✨ Generate AI Suggestions'}
          </button>
          <button 
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 26px rgba(245, 158, 11, 0.4)'
            }}
            onClick={downloadPDF}
            disabled={exporting}
          >
            {exporting ? '⏳ Downloading...' : '📥 Download PDF'}
          </button>
          <button 
            style={{
              padding: '12px 20px',
              background: 'transparent',
              color: '#6366f1',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={printCV}
          >
            🖨️ Print
          </button>
        </div>

        {/* Content Area */}
        <div style={{ 
          background: '#1a1f3a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          minHeight: '600px'
        }}>
          {activeTab === 'preview' && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <CVPreview profile={profile} ref={cvPreviewRef} />
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {!suggestions ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '24px' }}>🤖</div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700', color: '#e4e6eb' }}>
                    AI-Powered CV Optimization
                  </h3>
                  <p style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '32px' }}>
                    Click "Generate AI Suggestions" to get personalized recommendations for:
                  </p>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    maxWidth: '600px', 
                    margin: '0 auto',
                    textAlign: 'left'
                  }}>
                    <li style={{ padding: '12px 0', fontSize: '16px', color: '#d1d5db' }}>
                      ✨ Professional summary tailored to your experience
                    </li>
                    <li style={{ padding: '12px 0', fontSize: '16px', color: '#d1d5db' }}>
                      📝 Strong bullet points for your projects and experience
                    </li>
                    <li style={{ padding: '12px 0', fontSize: '16px', color: '#d1d5db' }}>
                      💼 LinkedIn profile optimization tips
                    </li>
                    <li style={{ padding: '12px 0', fontSize: '16px', color: '#d1d5db' }}>
                      🌐 Portfolio website recommendations
                    </li>
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
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 1000
          }}>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
};

// CV Preview Component
const CVPreview = React.forwardRef(({ profile }, ref) => {
  return (
    <div className="cv-preview" ref={ref} style={{
      background: '#ffffff',
      padding: '60px',
      borderRadius: '0',
      border: 'none',
      maxWidth: '850px',
      margin: '0 auto',
      fontFamily: 'Georgia, "Times New Roman", serif',
      color: '#000000',
      boxShadow: '0 0 30px rgba(0,0,0,0.1)'
    }}>
      {/* Header Section - Professional Format */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #2c3e50', paddingBottom: '20px' }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '32px', 
          fontWeight: '700', 
          color: '#2c3e50',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          {profile.name || 'YOUR NAME'}
        </h1>
        <h2 style={{ 
          margin: '0 0 15px 0', 
          fontSize: '16px', 
          fontWeight: '400', 
          color: '#34495e',
          fontStyle: 'italic'
        }}>
          {profile.title || 'Professional Title'}
        </h2>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '15px', 
          fontSize: '12px', 
          color: '#555',
          flexWrap: 'wrap'
        }}>
          {profile.basic?.location && <span>📍 {profile.basic.location}</span>}
          {profile.basic?.location && profile.basic?.availability && <span>|</span>}
          {profile.basic?.availability && <span>{profile.basic.availability}</span>}
        </div>
      </div>

      {/* Professional Summary */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '16px', 
          fontWeight: '700', 
          color: '#2c3e50',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          borderBottom: '2px solid #2c3e50',
          paddingBottom: '5px'
        }}>
          Professional Summary
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '13px', 
          lineHeight: '1.8', 
          color: '#333',
          textAlign: 'justify'
        }}>
          {profile.bio || 'Add your professional summary in your profile.'}
        </p>
      </div>

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '16px', 
            fontWeight: '700', 
            color: '#2c3e50',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            borderBottom: '2px solid #2c3e50',
            paddingBottom: '5px'
          }}>
            Technical Skills
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '13px', 
            lineHeight: '1.8', 
            color: '#333'
          }}>
            {profile.skills.join(' • ')}
          </p>
        </div>
      )}

      {/* Experience */}
      {profile.experiences && profile.experiences.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '16px', 
            fontWeight: '700', 
            color: '#2c3e50',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            borderBottom: '2px solid #2c3e50',
            paddingBottom: '5px'
          }}>
            Professional Experience
          </h3>
          {profile.experiences.map((exp, index) => (
            <div key={exp.id} style={{ 
              marginBottom: index < profile.experiences.length - 1 ? '20px' : '0',
              paddingBottom: index < profile.experiences.length - 1 ? '15px' : '0',
              borderBottom: index < profile.experiences.length - 1 ? '1px solid #ddd' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: '#2c3e50'
                }}>
                  {exp.role || 'Role'}
                </h4>
                <span style={{ 
                  fontSize: '11px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {exp.date || 'Date'}
                </span>
              </div>
              <p style={{ 
                margin: '2px 0 8px 0', 
                fontSize: '13px', 
                color: '#555', 
                fontWeight: '600'
              }}>
                {exp.company || 'Company'}{exp.location ? ` | ${exp.location}` : ''}
              </p>
              {exp.description && (
                <div style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: '12px', 
                  lineHeight: '1.7', 
                  color: '#333',
                  whiteSpace: 'pre-line'
                }}>
                  {exp.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {profile.projects && profile.projects.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '16px', 
            fontWeight: '700', 
            color: '#2c3e50',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            borderBottom: '2px solid #2c3e50',
            paddingBottom: '5px'
          }}>
            Key Projects
          </h3>
          {profile.projects.map((project, index) => (
            <div key={project.id} style={{ 
              marginBottom: index < profile.projects.length - 1 ? '20px' : '0',
              paddingBottom: index < profile.projects.length - 1 ? '15px' : '0',
              borderBottom: index < profile.projects.length - 1 ? '1px solid #ddd' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: '#2c3e50'
                }}>
                  {project.name || 'Project Name'}
                </h4>
                <span style={{ 
                  fontSize: '11px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {project.date || 'Date'}
                </span>
              </div>
              <p style={{ 
                margin: '2px 0 5px 0', 
                fontSize: '12px', 
                color: '#555', 
                fontStyle: 'italic'
              }}>
                {project.tech || 'Technologies'}
              </p>
              {project.link && (
                <p style={{ margin: '3px 0 8px 0', fontSize: '11px' }}>
                  <a href={project.link} target="_blank" rel="noopener noreferrer" style={{ 
                    color: '#2980b9', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}>
                    {project.link}
                  </a>
                </p>
              )}
              {project.description && (
                <div style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: '12px', 
                  lineHeight: '1.7', 
                  color: '#333',
                  whiteSpace: 'pre-line'
                }}>
                  {project.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '16px', 
            fontWeight: '700', 
            color: '#2c3e50',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            borderBottom: '2px solid #2c3e50',
            paddingBottom: '5px'
          }}>
            Education
          </h3>
          {profile.education.map((edu, index) => (
            <div key={edu.id} style={{ 
              marginBottom: index < profile.education.length - 1 ? '20px' : '0',
              paddingBottom: index < profile.education.length - 1 ? '15px' : '0',
              borderBottom: index < profile.education.length - 1 ? '1px solid #ddd' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: '#2c3e50'
                }}>
                  {edu.degree || 'Degree'}
                </h4>
                <span style={{ 
                  fontSize: '11px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {edu.date || 'Date'}
                </span>
              </div>
              <p style={{ 
                margin: '2px 0', 
                fontSize: '13px', 
                color: '#555', 
                fontWeight: '600'
              }}>
                {edu.school || 'School'}{edu.location ? ` | ${edu.location}` : ''}
              </p>
              {edu.description && (
                <p style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: '12px', 
                  lineHeight: '1.7', 
                  color: '#333'
                }}>
                  {edu.description}
                </p>
              )}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Professional Summary Suggestions */}
      {suggestions.professionalSummary && (
        <div style={{
          background: 'rgba(26, 31, 58, 0.6)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#e4e6eb' }}>
              ✨ Professional Summary
            </h3>
            <span style={{
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              AI Generated
            </span>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.7', color: '#d1d5db' }}>
            {suggestions.professionalSummary}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onApplySummary}
              disabled={applying}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ✨ Apply to Profile
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(suggestions.professionalSummary);
                alert('Copied to clipboard!');
              }}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: '#6366f1',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}

      {/* Experience Bullet Points */}
      {suggestions.experienceBullets && suggestions.experienceBullets.length > 0 && (
        <div style={{
          background: 'rgba(26, 31, 58, 0.6)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#e4e6eb' }}>
              💼 Enhanced Experience Bullet Points
            </h3>
            <span style={{
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              AI Generated
            </span>
          </div>
          {suggestions.experienceBullets.map((item, idx) => (
            <div key={idx} style={{ marginBottom: idx < suggestions.experienceBullets.length - 1 ? '24px' : 0, paddingBottom: idx < suggestions.experienceBullets.length - 1 ? '24px' : 0, borderBottom: idx < suggestions.experienceBullets.length - 1 ? '1px solid rgba(99, 102, 241, 0.2)' : 'none' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#a5b4fc' }}>
                {item.role || 'Experience'}
              </h4>
              <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', color: '#d1d5db', fontSize: '15px', lineHeight: '1.7' }}>
                {item.bullets.map((bullet, bidx) => (
                  <li key={bidx} style={{ marginBottom: '8px' }}>{bullet}</li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => onApplyExperience(item)}
                  disabled={applying}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ✨ Apply to Profile
                </button>
                <button 
                  onClick={() => {
                    const text = item.bullets.join('\n• ');
                    navigator.clipboard.writeText('• ' + text);
                    alert('Copied to clipboard!');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
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
        <div style={{
          background: 'rgba(26, 31, 58, 0.6)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#e4e6eb' }}>
              🚀 Enhanced Project Descriptions
            </h3>
            <span style={{
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              AI Generated
            </span>
          </div>
          {suggestions.projectBullets.map((item, idx) => (
            <div key={idx} style={{ marginBottom: idx < suggestions.projectBullets.length - 1 ? '24px' : 0, paddingBottom: idx < suggestions.projectBullets.length - 1 ? '24px' : 0, borderBottom: idx < suggestions.projectBullets.length - 1 ? '1px solid rgba(99, 102, 241, 0.2)' : 'none' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#a5b4fc' }}>
                {item.name || 'Project'}
              </h4>
              <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', color: '#d1d5db', fontSize: '15px', lineHeight: '1.7' }}>
                {item.bullets.map((bullet, bidx) => (
                  <li key={bidx} style={{ marginBottom: '8px' }}>{bullet}</li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => onApplyProject(item)}
                  disabled={applying}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ✨ Apply to Profile
                </button>
                <button 
                  onClick={() => {
                    const text = item.bullets.join('\n• ');
                    navigator.clipboard.writeText('• ' + text);
                    alert('Copied to clipboard!');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
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
        <div style={{
          background: 'rgba(26, 31, 58, 0.6)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#e4e6eb' }}>
              💼 LinkedIn Profile Optimization
            </h3>
            <span style={{
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Recommendations
            </span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {suggestions.linkedInTips.map((tip, idx) => (
              <li key={idx} style={{ 
                display: 'flex', 
                gap: '12px', 
                padding: '12px 0',
                borderBottom: idx < suggestions.linkedInTips.length - 1 ? '1px solid rgba(99, 102, 241, 0.1)' : 'none'
              }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <span style={{ fontSize: '15px', lineHeight: '1.7', color: '#d1d5db' }}>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Portfolio Recommendations */}
      {suggestions.portfolioTips && suggestions.portfolioTips.length > 0 && (
        <div style={{
          background: 'rgba(26, 31, 58, 0.6)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#e4e6eb' }}>
              🌐 Portfolio Website Recommendations
            </h3>
            <span style={{
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Recommendations
            </span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {suggestions.portfolioTips.map((tip, idx) => (
              <li key={idx} style={{ 
                display: 'flex', 
                gap: '12px', 
                padding: '12px 0',
                borderBottom: idx < suggestions.portfolioTips.length - 1 ? '1px solid rgba(99, 102, 241, 0.1)' : 'none'
              }}>
                <span style={{ fontSize: '20px' }}>🎨</span>
                <span style={{ fontSize: '15px', lineHeight: '1.7', color: '#d1d5db' }}>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CVAssistantPage;
