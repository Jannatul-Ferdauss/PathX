// ManageResources.jsx - Admin Resource Management (Courses)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { isAdmin } from '../../services/adminAuthService';
import AdminSidebar from '../Sidebar/AdminSidebar';

const ManageResources = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    platform: 'YouTube',
    url: '',
    logo: '',
    relatedSkills: [],
    costIndicator: 'Free',
    description: '',
  });

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!auth.currentUser || !(await isAdmin(auth.currentUser.uid))) {
      navigate('/login');
      return;
    }
    loadResources();
  };

  const loadResources = async () => {
    try {
      const resourcesRef = collection(db, 'courses');
      const snapshot = await getDocs(resourcesRef);
      const resourcesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResources(resourcesList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (error) {
      console.error('Error loading resources:', error);
      showToast('❌ Error loading resources');
    }
    setLoading(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      platform: 'YouTube',
      url: '',
      logo: '',
      relatedSkills: [],
      costIndicator: 'Free',
      description: '',
    });
    setSkillInput('');
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.relatedSkills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        relatedSkills: [...prev.relatedSkills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      relatedSkills: prev.relatedSkills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingResource) {
        await updateDoc(doc(db, 'courses', editingResource.id), {
          ...formData,
          updatedAt: Timestamp.now(),
        });
        showToast('✅ Resource updated successfully');
      } else {
        await addDoc(collection(db, 'courses'), {
          ...formData,
          createdAt: Timestamp.now(),
        });
        showToast('✅ Resource added successfully');
      }

      setShowAddModal(false);
      setEditingResource(null);
      resetForm();
      loadResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      showToast('❌ Error saving resource');
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title || '',
      platform: resource.platform || 'YouTube',
      url: resource.url || '',
      logo: resource.logo || '',
      relatedSkills: resource.relatedSkills || [],
      costIndicator: resource.costIndicator || 'Free',
      description: resource.description || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      await deleteDoc(doc(db, 'courses', resourceId));
      showToast('✅ Resource deleted successfully');
      loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      showToast('❌ Error deleting resource');
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.platform?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e4e6eb' }}>
          <div className="loading-spinner">Loading Resources...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#e4e6eb' }}>
            📚 Manage Resources
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#a5b4fc' }}>
            Add, edit, and manage course resources
          </p>
        </div>

        {/* Search and Add Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              background: '#1a1f3a',
              color: '#e4e6eb',
              fontSize: '14px',
              width: '300px',
            }}
          />
          <button
            onClick={() => {
              setEditingResource(null);
              resetForm();
              setShowAddModal(true);
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ➕ Add Resource
          </button>
        </div>

        {/* Resources Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              style={{
                background: 'linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              {/* Resource Image */}
              <div style={{
                width: '100%',
                height: '150px',
                borderRadius: '8px',
                background: resource.logo
                  ? `url(${resource.logo}) center/cover`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: '#fff',
                fontWeight: '700',
              }}>
                {!resource.logo && resource.platform?.[0]?.toUpperCase()}
              </div>

              {/* Resource Info */}
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#e4e6eb',
                  margin: '0 0 8px 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {resource.title}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#a5b4fc',
                  margin: '0 0 8px 0',
                }}>
                  📺 {resource.platform}
                </p>

                <p style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: '0 0 8px 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  🔗 {resource.url}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <span style={{
                    padding: '4px 8px',
                    background: resource.costIndicator === 'Free'
                      ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                      : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {resource.costIndicator}
                  </span>
                </div>

                {resource.relatedSkills && resource.relatedSkills.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      margin: '0 0 4px 0',
                    }}>
                      🎯 Skills:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {resource.relatedSkills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} style={{
                          padding: '2px 6px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}>
                          {skill}
                        </span>
                      ))}
                      {resource.relatedSkills.length > 3 && (
                        <span style={{
                          padding: '2px 6px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}>
                          +{resource.relatedSkills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => handleEdit(resource)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#e4e6eb', marginBottom: '24px' }}>
                {editingResource ? '✏️ Edit Resource' : '➕ Add New Resource'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>
                      Platform *
                    </label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0a0e27',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px',
                        color: '#e4e6eb',
                        fontSize: '14px',
                      }}
                    >
                      <option value="YouTube">YouTube</option>
                      <option value="Udemy">Udemy</option>
                      <option value="Coursera">Coursera</option>
                      <option value="Local">Local</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>
                      Cost Indicator
                    </label>
                    <select
                      value={formData.costIndicator}
                      onChange={(e) => setFormData({ ...formData, costIndicator: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0a0e27',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px',
                        color: '#e4e6eb',
                        fontSize: '14px',
                      }}
                    >
                      <option value="Free">Free</option>
                      <option value="Paid">Paid</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>
                    URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>
                    Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>
                    Related Skills
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      placeholder="Add a skill..."
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#0a0e27',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px',
                        color: '#e4e6eb',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {formData.relatedSkills.map((skill, idx) => (
                      <span key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#a5b4fc',
                            cursor: 'pointer',
                            fontSize: '14px',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {editingResource ? '💾 Update Resource' : '➕ Add Resource'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingResource(null);
                      resetForm();
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%)',
            color: '#e4e6eb',
            padding: '16px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1001,
          }}>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageResources;