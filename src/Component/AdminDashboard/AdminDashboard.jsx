// AdminDashboard.jsx - Admin Control Panel for API Configuration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { isAdmin } from '../../services/adminAuthService';
import {
  getAPIConfig,
  updateAPIConfig,
  testAPIProvider,
  API_PROVIDERS,
  getAvailableModels,
  clearConfigCache,
} from '../../services/apiProviderService';
import AdminSidebar from '../Sidebar/AdminSidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({ gemini: false, openrouter: false, groq: false });
  const [authorized, setAuthorized] = useState(false);

  // API Configuration State
  const [config, setConfig] = useState({
    primaryProvider: API_PROVIDERS.GEMINI,
    fallbackProvider: API_PROVIDERS.GROQ,
    secondFallbackProvider: API_PROVIDERS.OPENROUTER,
    geminiApiKey: '',
    openrouterApiKey: '',
    groqApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    openrouterModel: 'google/gemini-2.0-flash-exp:free',
    groqModel: 'llama-3.3-70b-versatile',
    autoFallback: true,
  });

  const [testResults, setTestResults] = useState({
    gemini: null,
    openrouter: null,
    groq: null,
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  // Check admin authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const adminStatus = await isAdmin(currentUser.uid);
      
      if (!adminStatus) {
        setMessage({ type: 'error', text: '⛔ Access Denied: Admin privileges required' });
        setTimeout(() => navigate('/userdash'), 3000);
        return;
      }

      setAuthorized(true);
      loadConfiguration();
    };

    checkAuthorization();
  }, [navigate]);

  // Load current configuration
  const loadConfiguration = async () => {
    try {
      const currentConfig = await getAPIConfig();
      setConfig(currentConfig);
      setLoading(false);
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' });
  };

  // Save configuration
  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateAPIConfig(config);
      clearConfigCache();
      setMessage({ type: 'success', text: '✅ Configuration saved successfully!' });
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: '❌ Failed to save configuration: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  // Test API provider
  const handleTestProvider = async (provider) => {
    setTesting(prev => ({ ...prev, [provider]: true }));
    setTestResults(prev => ({ ...prev, [provider]: null }));

    try {
      let apiKey, model;
      
      // Get the correct API key and model based on provider
      if (provider === API_PROVIDERS.GEMINI) {
        apiKey = config.geminiApiKey;
        model = config.geminiModel;
      } else if (provider === API_PROVIDERS.OPENROUTER) {
        apiKey = config.openrouterApiKey;
        model = config.openrouterModel;
      } else if (provider === API_PROVIDERS.GROQ) {
        apiKey = config.groqApiKey;
        model = config.groqModel;
      }

      if (!apiKey) {
        setTestResults(prev => ({
          ...prev,
          [provider]: { success: false, message: '❌ API key is required' },
        }));
        return;
      }

      const result = await testAPIProvider(provider, apiKey, model);
      setTestResults(prev => ({ ...prev, [provider]: result }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: false, message: `❌ Test failed: ${error.message}` },
      }));
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e4e6eb' }}>
          <div className="loading-spinner">Loading Admin Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e4e6eb' }}>
          <div className="error-message">{message.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
      <AdminSidebar />
      
      <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#e4e6eb' }}>⚙️ API Settings</h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#a5b4fc' }}>Manage API Configuration & Provider Settings</p>
          </div>
        </div>

        {message.text && (
          <div className={`admin-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Provider Strategy */}
        <div className="config-section">
          <h2>📡 Provider Strategy</h2>
          
          <div className="form-group">
            <label>Primary Provider</label>
            <select
              value={config.primaryProvider}
              onChange={(e) => handleInputChange('primaryProvider', e.target.value)}
            >
              <option value={API_PROVIDERS.GEMINI}>Gemini (Direct)</option>
              <option value={API_PROVIDERS.GROQ}>Groq (Fast & Free)</option>
              <option value={API_PROVIDERS.OPENROUTER}>OpenRouter</option>
            </select>
          </div>

          <div className="form-group">
            <label>1st Fallback Provider</label>
            <select
              value={config.fallbackProvider}
              onChange={(e) => handleInputChange('fallbackProvider', e.target.value)}
            >
              <option value={API_PROVIDERS.GROQ}>Groq (Fast & Free)</option>
              <option value={API_PROVIDERS.OPENROUTER}>OpenRouter</option>
              <option value={API_PROVIDERS.GEMINI}>Gemini (Direct)</option>
            </select>
            <small>This provider will be used if the primary provider fails</small>
          </div>

          <div className="form-group">
            <label>2nd Fallback Provider</label>
            <select
              value={config.secondFallbackProvider}
              onChange={(e) => handleInputChange('secondFallbackProvider', e.target.value)}
            >
              <option value={API_PROVIDERS.OPENROUTER}>OpenRouter</option>
              <option value={API_PROVIDERS.GROQ}>Groq (Fast & Free)</option>
              <option value={API_PROVIDERS.GEMINI}>Gemini (Direct)</option>
            </select>
            <small>This provider will be used if both primary and 1st fallback fail</small>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.autoFallback}
                onChange={(e) => handleInputChange('autoFallback', e.target.checked)}
              />
              Enable Auto-Fallback (Automatically switch to fallback provider if primary fails)
            </label>
          </div>
        </div>

        {/* Gemini Configuration */}
        <div className="config-section">
          <h2>🤖 Gemini API Configuration</h2>
          
          <div className="form-group">
            <label>Gemini API Key</label>
            <input
              type="password"
              value={config.geminiApiKey}
              onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
              placeholder="Enter Gemini API Key"
            />
            <small>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></small>
          </div>

          <div className="form-group">
            <label>Gemini Model</label>
            <select
              value={config.geminiModel}
              onChange={(e) => handleInputChange('geminiModel', e.target.value)}
            >
              {getAvailableModels(API_PROVIDERS.GEMINI).map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="test-button"
            onClick={() => handleTestProvider(API_PROVIDERS.GEMINI)}
            disabled={testing.gemini || !config.geminiApiKey}
          >
            {testing.gemini ? 'Testing...' : '🧪 Test Gemini Connection'}
          </button>

          {testResults.gemini && (
            <div className={`test-result ${testResults.gemini.success ? 'success' : 'error'}`}>
              {testResults.gemini.message}
            </div>
          )}
        </div>

        {/* OpenRouter Configuration */}
        <div className="config-section">
          <h2>🌐 OpenRouter API Configuration</h2>
          
          <div className="form-group">
            <label>OpenRouter API Key</label>
            <input
              type="password"
              value={config.openrouterApiKey}
              onChange={(e) => handleInputChange('openrouterApiKey', e.target.value)}
              placeholder="Enter OpenRouter API Key"
            />
            <small>
              Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">OpenRouter Dashboard</a>
              <br />
              ⚠️ <strong>Important:</strong> For free models, configure privacy settings at{' '}
              <a href="https://openrouter.ai/settings/privacy" target="_blank" rel="noopener noreferrer">OpenRouter Privacy</a>
              {' '}and enable "Free model publication"
            </small>
          </div>

          <div className="form-group">
            <label>OpenRouter Model ID</label>
            <input
              type="text"
              value={config.openrouterModel}
              onChange={(e) => handleInputChange('openrouterModel', e.target.value)}
              placeholder="e.g., google/gemini-2.0-flash-exp:free"
            />
            <small>
              Find model IDs at <a href="https://openrouter.ai/docs/models" target="_blank" rel="noopener noreferrer">OpenRouter Models</a>
              {' | '}Popular: google/gemini-2.0-flash-exp:free, meta-llama/llama-3.2-3b-instruct:free
            </small>
          </div>
          
          <div className="form-group">
            <label>Quick Select Common Models</label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleInputChange('openrouterModel', e.target.value);
                }
              }}
              value=""
            >
              <option value="">-- Select a common model --</option>
              {getAvailableModels(API_PROVIDERS.OPENROUTER).map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <small>Or enter any model ID from OpenRouter manually above</small>
          </div>

          <button
            className="test-button"
            onClick={() => handleTestProvider(API_PROVIDERS.OPENROUTER)}
            disabled={testing.openrouter || !config.openrouterApiKey}
          >
            {testing.openrouter ? 'Testing...' : '🧪 Test OpenRouter Connection'}
          </button>

          {testResults.openrouter && (
            <div className={`test-result ${testResults.openrouter.success ? 'success' : 'error'}`}>
              {testResults.openrouter.message}
            </div>
          )}
        </div>

        {/* Groq Configuration */}
        <div className="config-section">
          <h2>⚡ Groq API Configuration</h2>
          
          <div className="form-group">
            <label>Groq API Key</label>
            <input
              type="password"
              value={config.groqApiKey}
              onChange={(e) => handleInputChange('groqApiKey', e.target.value.trim())}
              placeholder="Enter Groq API Key (starts with gsk_)"
            />
            <small>
              Get your FREE API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">Groq Console</a>
              <br />
              ⚡ <strong>Fast & Free:</strong> Groq provides extremely fast inference with generous free tier
              <br />
              ⚠️ <strong>Note:</strong> Copy the entire key including "gsk_" prefix. Remove any extra spaces.
            </small>
          </div>

          <div className="form-group">
            <label>Groq Model ID</label>
            <input
              type="text"
              value={config.groqModel}
              onChange={(e) => handleInputChange('groqModel', e.target.value)}
              placeholder="e.g., llama-3.3-70b-versatile"
            />
            <small>
              Find model IDs at <a href="https://console.groq.com/docs/models" target="_blank" rel="noopener noreferrer">Groq Models</a>
              {' | '}Popular: llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it
            </small>
          </div>
          
          <div className="form-group">
            <label>Quick Select Common Models</label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleInputChange('groqModel', e.target.value);
                }
              }}
              value=""
            >
              <option value="">-- Select a common model --</option>
              {getAvailableModels(API_PROVIDERS.GROQ).map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <small>Or enter any model ID from Groq manually above</small>
          </div>

          <button
            className="test-button"
            onClick={() => handleTestProvider(API_PROVIDERS.GROQ)}
            disabled={testing.groq || !config.groqApiKey}
          >
            {testing.groq ? 'Testing...' : '🧪 Test Groq Connection'}
          </button>

          {testResults.groq && (
            <div className={`test-result ${testResults.groq.success ? 'success' : 'error'}`}>
              {testResults.groq.message}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="admin-actions">
          <button
            className="save-button"
            onClick={handleSaveConfig}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Configuration'}
          </button>
        </div>

        {/* Information Panel */}
        <div className="info-panel">
          <h3>ℹ️ How It Works</h3>
          <ul>
            <li><strong>Primary Provider:</strong> The AI service that will be used first for all API calls</li>
            <li><strong>Fallback Provider:</strong> The backup AI service to use if primary fails</li>
            <li><strong>Auto-Fallback:</strong> If enabled, automatically switches to fallback provider when primary fails</li>
            <li><strong>Gemini:</strong> Google's direct Gemini API (requires Google AI Studio API key)</li>
            <li><strong>Groq:</strong> Ultra-fast AI inference with generous free tier - Get key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">Groq Console</a></li>
            <li><strong>OpenRouter:</strong> Unified API gateway supporting multiple AI models - you can use any model ID from <a href="https://openrouter.ai/docs/models" target="_blank" rel="noopener noreferrer">their catalog</a></li>
            <li><strong>Custom Models:</strong> For OpenRouter, enter any model ID manually (e.g., anthropic/claude-3-sonnet, openai/gpt-4-turbo)</li>
            <li><strong>API Keys:</strong> Securely stored in Firebase and used by all AI features (CareerBot, Skill Extraction, Roadmap)</li>
          </ul>
          
          <h3>💡 Recommended Setup</h3>
          <ul>
            <li><strong>Primary:</strong> Gemini 2.5 Flash (Best quality)</li>
            <li><strong>Fallback:</strong> Groq (Fast & Free backup)</li>
            <li><strong>Alternative:</strong> Groq as primary for maximum speed, Gemini as fallback for quality</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
