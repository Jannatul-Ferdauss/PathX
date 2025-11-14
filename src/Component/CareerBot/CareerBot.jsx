// CareerBot.jsx - AI Career Mentor Chat Interface
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Sidebar from '../Sidebar/Sidebar';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  generateCareerBotResponse,
  getSuggestedQuestions,
  saveConversation,
  validateUserInput,
  getQuickResponse,
} from './careerBotService';
import './CareerBot.css';

export default function CareerBot() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auth & Profile
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');

  // UI state
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Load user profile
  useEffect(() => {
    if (!currentUser) return;

    const loadProfile = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profile = docSnap.data();
          setUserProfile(profile);
          setSuggestedQuestions(getSuggestedQuestions(profile));
          
          // Welcome message
          setMessages([
            {
              id: Date.now(),
              role: 'bot',
              content: `Hi ${profile.name || 'there'}! 👋 I'm your PathX Career Mentor ready to help with career guidance, skill development, job strategies, and interview prep. What would you like to know?`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. Some features may be limited.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage;
    
    // Validate input
    const validation = validateUserInput(textToSend);
    if (!validation.valid) {
      setError(validation.error);
      setTimeout(() => setError(''), 3000);
      return;
    }

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: validation.message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    setShowSuggestions(false);
    setError('');

    try {
      // Generate AI response
      const response = await generateCareerBotResponse(
        validation.message,
        userProfile,
        messages
      );

      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: response.response,
        timestamp: response.timestamp,
        disclaimer: response.disclaimer,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Save to Firestore
      await saveConversation(validation.message, response);

    } catch (err) {
      console.error('CareerBot error:', err);
      const errorResponse = getQuickResponse('error');
      
      const errorMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: errorResponse.message,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      
      setMessages((prev) => [...prev, errorMsg]);
      setError(err.message || 'Failed to get response. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle suggested question click
  const handleSuggestionClick = (questionText) => {
    setInputMessage(questionText);
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="careerbot-loading">
        <div className="loading-spinner"></div>
        <p>Loading CareerBot...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="careerbot-page">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="careerbot-main">
        {/* Header */}
        <header className="careerbot-header">
          <div className="header-top">
            <div className="header-content">
              <div className="bot-avatar">🤖</div>
              <div className="header-info">
                <h1>PathX Career Mentor</h1>
                <p className="subtitle">AI-powered career guidance for youth employment (SDG 8)</p>
              </div>
            </div>
            {userProfile && (
              <div className="header-user">
                <span className="user-greeting">Hi, {userProfile.name || 'User'}!</span>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              {msg.disclaimer && (
                <div className="message-disclaimer">
                  ⚠️ {msg.disclaimer}
                </div>
              )}
              {msg.isError && (
                <div className="message-error-badge">Error</div>
              )}
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message bot">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="typing-text">AI is thinking...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {showSuggestions && suggestedQuestions.length > 0 && messages.length <= 1 && (
        <div className="suggestions-container">
          <p className="suggestions-title">Suggested Questions:</p>
          <div className="suggestions-grid">
            {suggestedQuestions.slice(0, 6).map((question) => (
              <button
                key={question.id}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(question.text)}
              >
                <span className="suggestion-icon">{question.icon}</span>
                <span className="suggestion-text">{question.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Input Area */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your career, skills, or learning path..."
            className="message-input"
            rows="1"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="send-button"
          >
            {isTyping ? '⏳' : '➤'}
          </button>
        </div>
        <div className="input-footer">
          <span className="input-hint">
            💡 Tip: Be specific about your skills and goals for better advice
          </span>
          <span className="char-count">
            {inputMessage.length}/500
          </span>
        </div>
      </div>
      </main>
    </div>
  );
}
