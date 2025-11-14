import React, { useState, useRef } from 'react';
import { extractSkills, extractTextFromFile, mergeSkills } from '../../utils/skillExtractor';
import { db, auth } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function SkillExtractionDisplay({ 
  currentProfile = {}, 
  onSkillsExtracted = () => {}, 
  onClose = () => {} 
}) {
  // ============= STATE MANAGEMENT =============
  const [inputMethod, setInputMethod] = useState('paste'); // 'paste' or 'upload'
  const [cvText, setCvText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedResult, setExtractedResult] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [processingStep, setProcessingStep] = useState(null);
  const fileInputRef = useRef(null);

  // ============= HELPER FUNCTIONS =============
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const clearError = () => setError(null);

  // ============= FILE HANDLING =============
  const handleFileSelect = async (e) => {
    clearError();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
  };

  // ============= TEXT EXTRACTION =============
  const extractCVText = async () => {
    clearError();

    if (inputMethod === 'paste' && !cvText.trim()) {
      setError('Please paste CV content first');
      return;
    }

    if (inputMethod === 'upload' && !selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setLoading(true);
      setProcessingStep('Preparing CV text...');

      let textContent = '';

      if (inputMethod === 'paste') {
        textContent = cvText;
      } else {
        textContent = await extractTextFromFile(selectedFile);
      }

      if (!textContent.trim()) {
        throw new Error('Extracted text is empty');
      }

      // Proceed with skill extraction
      await extractCVSkills(textContent);
    } catch (err) {
      setError(err.message || 'Failed to extract CV text');
      setProcessingStep(null);
    } finally {
      setLoading(false);
    }
  };

  // ============= SKILL EXTRACTION =============
  const extractCVSkills = async (textContent) => {
    try {
      setProcessingStep('Analyzing CV with AI...');

      const result = await extractSkills(textContent);

      if (!result.success) {
        throw new Error(result.error || 'Skill extraction failed');
      }

      setExtractedResult(result);
      setSelectedSkills(result.allSkills || []);
      setProcessingStep(null);
      showToast('✅ Skills extracted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to extract skills');
      setProcessingStep(null);
    }
  };

  // ============= SKILL SELECTION MANAGEMENT =============
  const toggleSkillSelection = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const selectAllSkills = () => {
    setSelectedSkills([...(extractedResult?.allSkills || [])]);
  };

  const deselectAllSkills = () => {
    setSelectedSkills([]);
  };

  // ============= ADD SKILLS TO PROFILE =============
  const addSkillsToProfile = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to save skills');
      return;
    }

    if (selectedSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    try {
      setLoading(true);
      setProcessingStep('Saving skills to profile...');

      // Merge skills
      const currentSkills = Array.isArray(currentProfile.skills) ? currentProfile.skills : [];
      const mergedSkills = mergeSkills(currentSkills, selectedSkills);

      // Update Firebase
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { skills: mergedSkills });

      setProcessingStep(null);
      showToast(`✅ Added ${selectedSkills.length} skills to your profile!`);

      // Notify parent component
      onSkillsExtracted({
        skills: mergedSkills,
        extractionDetails: extractedResult,
      });

      // Reset form
      setTimeout(() => {
        setCvText('');
        setSelectedFile(null);
        setExtractedResult(null);
        setSelectedSkills([]);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to save skills');
      setProcessingStep(null);
    } finally {
      setLoading(false);
    }
  };

  // ============= EDIT SKILL =============
  const editSkill = (oldSkill, newSkill) => {
    if (!newSkill.trim()) return;
    setSelectedSkills((prev) =>
      prev.map((s) => (s === oldSkill ? newSkill : s))
    );
  };

  const removeSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const addCustomSkill = (newSkill) => {
    if (newSkill.trim() && !selectedSkills.includes(newSkill)) {
      setSelectedSkills((prev) => [...prev, newSkill.trim()]);
    }
  };

  // ============= RENDER HELPERS =============
  const renderSkillCategory = (category, skills, categoryLabel) => {
    if (!skills || skills.length === 0) return null;

    return (
      <div key={category} style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '12px 0 8px 0', color: '#6366f1', fontSize: 14, fontWeight: 600 }}>
          {categoryLabel}
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {skills.map((skill, idx) => (
            <div
              key={`${category}-${idx}`}
              style={{
                background: selectedSkills.includes(skill) ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.1)',
                border: `1px solid ${selectedSkills.includes(skill) ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.3)'}`,
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: '#e4e6eb',
                transition: 'all 0.2s ease',
                boxShadow: selectedSkills.includes(skill) ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none',
              }}
              onClick={() => toggleSkillSelection(skill)}
              title={`Click to ${selectedSkills.includes(skill) ? 'deselect' : 'select'}`}
            >
              <input
                type="checkbox"
                checked={selectedSkills.includes(skill)}
                onChange={() => {}}
                style={{ cursor: 'pointer', width: 14, height: 14 }}
              />
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============= MAIN RENDER =============
  return (
    <div
      style={{
        background: '#1a1f3a',
        borderRadius: 12,
        padding: 24,
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e4e6eb' }}>🤖 AI Skill Extractor</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#a5b4fc' }}>
            Extract skills from your CV using Gemini AI
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a5b4fc',
            fontSize: 24,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#fca5a5',
            fontSize: 13,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={clearError}
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: INPUT METHOD SELECTION */}
      {!extractedResult ? (
        <>
          {/* Input Method Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>
              How would you like to provide your CV?
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setInputMethod('paste')}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: inputMethod === 'paste' ? '2px solid #6366f1' : '1px solid rgba(99, 102, 241, 0.3)',
                  background: inputMethod === 'paste' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: '#e4e6eb',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 0.2s ease',
                }}
              >
                📋 Paste Text
              </button>
              <button
                onClick={() => setInputMethod('upload')}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: inputMethod === 'upload' ? '2px solid #6366f1' : '1px solid rgba(99, 102, 241, 0.3)',
                  background: inputMethod === 'upload' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: '#e4e6eb',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 0.2s ease',
                }}
              >
                📁 Upload File
              </button>
            </div>
          </div>

          {/* INPUT AREA */}
          {inputMethod === 'paste' ? (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>
                Paste your CV content (text only):
              </label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste your CV text here... The AI will analyze it to extract your skills."
                style={{
                  width: '100%',
                  minHeight: 200,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  background: 'rgba(26, 31, 58, 0.6)',
                  color: '#e4e6eb',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
              <p style={{ fontSize: 11, color: '#a5b4fc', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                💡 Tip: Copy your CV content and paste it here. You can use Word, Google Docs, or any text format.
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>
                Select a CV file (.pdf or .txt):
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(99, 102, 241, 0.5)',
                  borderRadius: 8,
                  padding: 32,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(99, 102, 241, 0.05)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                }}
              >
                <p style={{ margin: 0, fontSize: 14, color: '#e4e6eb', fontWeight: 600 }}>📄 Click to upload CV file</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#a5b4fc' }}>
                  {selectedFile ? selectedFile.name : 'PDF or TXT format (max 5MB)'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* EXTRACT BUTTON */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={extractCVText}
              disabled={loading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: 'none',
                background: loading ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: 13,
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? `🔄 ${processingStep || 'Processing...'}` : '✨ Extract Skills with AI'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* STEP 2: REVIEW & SELECT EXTRACTED SKILLS */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e4e6eb' }}>
                ✅ Skills Extracted ({selectedSkills.length} selected)
              </h3>
              {extractedResult?.data?.summary && (
                <p style={{ margin: 0, fontSize: 12, color: '#a5b4fc', fontStyle: 'italic', maxWidth: '50%' }}>
                  {extractedResult.data.summary}
                </p>
              )}
            </div>

            {/* SKILL CATEGORIES */}
            <div style={{ marginBottom: 16, maxHeight: 400, overflowY: 'auto' }}>
              {extractedResult?.data && (
                <>
                  {renderSkillCategory('technical', extractedResult.data.technicalSkills, '💻 Technical Skills')}
                  {renderSkillCategory('professional', extractedResult.data.professionalSkills, '🎯 Professional Skills')}
                  {renderSkillCategory('tools', extractedResult.data.tools, '🛠️ Tools & Technologies')}
                  {renderSkillCategory('roles', extractedResult.data.roles, '💼 Roles/Domains')}
                  {renderSkillCategory('domains', extractedResult.data.domains, '🌐 Industry Domains')}
                </>
              )}
            </div>

            {/* SELECT/DESELECT ALL */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={selectAllSkills}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid rgba(99, 102, 241, 0.5)',
                  background: 'transparent',
                  color: '#a5b4fc',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.target.style.color = '#e4e6eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#a5b4fc';
                }}
              >
                ✓ Select All
              </button>
              <button
                onClick={deselectAllSkills}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid rgba(99, 102, 241, 0.5)',
                  background: 'transparent',
                  color: '#a5b4fc',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.target.style.color = '#e4e6eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#a5b4fc';
                }}
              >
                ✕ Deselect All
              </button>
            </div>

            {/* CUSTOM SKILL INPUT */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>
                Add custom skills (not extracted):
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Type a skill and press Add"
                  id="customSkillInput"
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    background: 'rgba(26, 31, 58, 0.6)',
                    color: '#e4e6eb',
                    fontSize: 12,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = document.getElementById('customSkillInput');
                      addCustomSkill(input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('customSkillInput');
                    addCustomSkill(input.value);
                    input.value = '';
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  +Add
                </button>
              </div>
            </div>

            {/* SELECTED SKILLS PREVIEW */}
            {selectedSkills.length > 0 && (
              <div style={{ marginBottom: 16, padding: 12, background: 'rgba(99, 102, 241, 0.1)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>
                  Selected Skills to Add ({selectedSkills.length}):
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedSkills.map((skill, idx) => (
                    <div
                      key={`selected-${idx}`}
                      style={{
                        background: 'rgba(99, 102, 241, 0.3)',
                        border: '1px solid rgba(99, 102, 241, 0.6)',
                        borderRadius: 999,
                        padding: '4px 10px',
                        fontSize: 11,
                        color: '#e4e6eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(skill)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 'bold',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={addSkillsToProfile}
              disabled={selectedSkills.length === 0 || loading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: 'none',
                background:
                  selectedSkills.length === 0 || loading
                    ? 'rgba(99, 102, 241, 0.3)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                cursor: selectedSkills.length === 0 || loading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: 13,
                transition: 'all 0.2s ease',
                opacity: selectedSkills.length === 0 || loading ? 0.6 : 1,
              }}
            >
              {loading ? `🔄 ${processingStep || 'Saving...'}` : '💾 Add Skills to Profile'}
            </button>
            <button
              onClick={() => {
                setExtractedResult(null);
                setSelectedSkills([]);
                setCvText('');
                setSelectedFile(null);
              }}
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'transparent',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
            >
              Start Over
            </button>
          </div>

          {/* INFO MESSAGE */}
          {extractedResult?.method === 'keyword-based' && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.5)',
                borderRadius: 6,
                fontSize: 11,
                color: '#fef08a',
              }}
            >
              ℹ️ Using keyword-based extraction. For better AI-powered results, ensure you have a valid Gemini API key.
            </div>
          )}
        </>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: '#0f172a',
            border: '1px solid rgba(99, 102, 241, 0.5)',
            color: '#a5b4fc',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
