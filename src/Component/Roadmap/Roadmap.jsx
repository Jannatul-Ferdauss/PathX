import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './roadmap.css';
import { generateAndSaveForCurrentUser, generateRoadmap } from '../../utils/roadmapService';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import Sidebar from '../Sidebar/Sidebar';

export default function Roadmap() {
  const navigate = useNavigate();
  const [currentSkills, setCurrentSkills] = useState('');
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [timeframe, setTimeframe] = useState(3);
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch user skills from Firestore on component mount
  useEffect(() => {
    const fetchUserSkills = async () => {
      if (!auth.currentUser) return;
      
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const skills = userData.skills || [];
          if (skills.length > 0) {
            setCurrentSkills(skills.join(', '));
          }
        }
      } catch (err) {
        console.error('Error fetching user skills:', err);
      }
    };

    fetchUserSkills();
  }, []);

  const handleGenerate = async (save = false) => {
    setError('');
    setLoading(true);
    try {
      const inputs = { currentSkills, targetRole, timeframeMonths: Number(timeframe), weeklyHours: Number(weeklyHours) };
      let genRes;
      if (save) {
        // saves to current user; will throw if not logged in
        genRes = await generateAndSaveForCurrentUser(inputs);
      } else {
        genRes = await generateRoadmap(inputs);
      }

      if (!genRes.success) throw new Error(genRes.error || 'Generation failed');
      setResult(genRes.roadmap);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = margin;
    
    // Helper to add text with word wrap and page breaks
    const addText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      lines.forEach(line => {
        if (yPos + fontSize / 2 > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += fontSize / 2 + 2;
      });
    };
    
    const addSpace = (space = 5) => {
      yPos += space;
    };
    
    // Title
    addText(`CAREER ROADMAP: ${targetRole}`, 18, true, [99, 102, 241]);
    addSpace(3);
    
    // Metadata
    addText(`Generated: ${new Date().toLocaleDateString()}`, 10, false, [100, 100, 100]);
    addText(`Timeframe: ${timeframe} months | Weekly Hours: ${weeklyHours}`, 10, false, [100, 100, 100]);
    addSpace(8);
    
    // Summary
    addText('SUMMARY', 14, true, [139, 92, 246]);
    addSpace(3);
    addText(result.summary, 11);
    addSpace(8);
    
    // Learning Path
    addText('LEARNING PATH', 14, true, [139, 92, 246]);
    addSpace(5);
    
    if (Array.isArray(result.phases)) {
      result.phases.forEach((phase, i) => {
        addText(`Phase ${i + 1}: ${phase.title}`, 12, true, [99, 102, 241]);
        if (phase.durationWeeks) {
          addText(`Duration: ${phase.durationWeeks} weeks`, 10, false, [100, 100, 100]);
        }
        addSpace(3);
        
        addText('Topics/Technologies to Learn:', 11, true);
        const topics = Array.isArray(phase.focus) ? phase.focus : [phase.focus];
        topics.forEach(t => {
          addText(`  • ${t}`, 10);
        });
        addSpace(3);
        
        if (Array.isArray(phase.projects) && phase.projects.length > 0) {
          addText('Project Ideas:', 11, true);
          phase.projects.forEach(p => {
            addText(`  • ${p}`, 10);
          });
        }
        addSpace(6);
      });
    }
    
    // When to Apply
    addText('WHEN TO START APPLYING', 14, true, [139, 92, 246]);
    addSpace(3);
    addText(result.applySuggestion, 11);
    addSpace(5);
    
    if (result.estimatedWeeklyPlan) {
      addText('WEEKLY PLAN', 14, true, [139, 92, 246]);
      addSpace(3);
      addText(result.estimatedWeeklyPlan, 11);
    }
    
    // Save PDF
    doc.save(`career-roadmap-${targetRole.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
  };

  return (
    <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <main style={{ flex: 1, padding: 24 }}>
        <div className="roadmap-page">
          <h2>AI Career Roadmap</h2>
          <div className="roadmap-form">
        <label>
          Current skills (from your profile):
          <div style={{ 
            padding: '12px',
            marginTop: 8,
            background: '#0a0e27',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 8,
            color: '#e4e6eb',
            minHeight: 100,
            lineHeight: '1.6'
          }}>
            {currentSkills || 'No skills found in your profile. Please add skills in your profile page.'}
          </div>
        </label>
        <label>
          Target role:
          <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Full Stack Developer">Full Stack Developer</option>
            <option value="Data Scientist">Data Scientist</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="Machine Learning Engineer">Machine Learning Engineer</option>
            <option value="DevOps Engineer">DevOps Engineer</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            <option value="Mobile App Developer">Mobile App Developer</option>
            <option value="Cloud Engineer">Cloud Engineer</option>
            <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
            <option value="Software Engineer">Software Engineer</option>
          </select>
        </label>
        <div className="two-col">
          <label>
            Timeframe (months):
            <input type="number" min="1" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} />
          </label>
          <label>
            Hours per week:
            <input type="number" min="1" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} />
          </label>
        </div>

        <div className="actions">
          <button onClick={() => handleGenerate(true)} disabled={loading || !auth.currentUser}>{loading ? 'Generating...' : 'Generate Roadmap'}</button>
          <button onClick={handleDownload} disabled={!result}>Download as PDF</button>
        </div>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="roadmap-result">
            <div className="roadmap-header">
              <h3>📋 Your Personalized Career Roadmap</h3>
              <span className="roadmap-date">Generated: {new Date().toLocaleDateString()}</span>
            </div>

            <div className="roadmap-summary">
              <h4>📝 Summary</h4>
              <p>{result.summary}</p>
            </div>

            <div className="roadmap-phases">
              <h4>🎯 Learning Path ({timeframe} months)</h4>
              {Array.isArray(result.phases) && result.phases.map((p, i) => (
                <div key={i} className="phase-card">
                  <div className="phase-header">
                    <span className="phase-number">Phase {i + 1}</span>
                    <h5>{p.title}</h5>
                    {p.durationWeeks && <span className="phase-duration">⏱️ {p.durationWeeks} weeks</span>}
                  </div>
                  
                  <div className="phase-content">
                    <div className="phase-section">
                      <strong>📚 Topics/Technologies to Learn:</strong>
                      <ul>
                        {(Array.isArray(p.focus) ? p.focus : [p.focus]).map((topic, idx) => (
                          <li key={idx}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {Array.isArray(p.projects) && p.projects.length > 0 && (
                      <div className="phase-section">
                        <strong>💡 Project Ideas:</strong>
                        <ul>
                          {p.projects.map((proj, idx) => (
                            <li key={idx}>{proj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="roadmap-apply">
              <h4>🚀 When to Start Applying</h4>
              <p>{result.applySuggestion}</p>
            </div>

            {result.estimatedWeeklyPlan && (
              <div className="roadmap-weekly">
                <h4>📅 Weekly Plan</h4>
                <p>{result.estimatedWeeklyPlan}</p>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
