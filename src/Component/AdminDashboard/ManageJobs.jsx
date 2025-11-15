import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { isAdmin } from '../../services/adminAuthService';
import AdminSidebar from '../Sidebar/AdminSidebar';

const ManageJobs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    category: 'IT/Software',
    salary: '',
    description: '',
    requirements: '',
    applyLink: '',
    logo: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!auth.currentUser || !(await isAdmin(auth.currentUser.uid))) {
      navigate('/login');
      return;
    }
    loadJobs();
  };

  const loadJobs = async () => {
    try {
      const jobsRef = collection(db, 'jobs');
      const snapshot = await getDocs(jobsRef);
      const jobsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsList.sort((a, b) => (b.postedDate || 0) - (a.postedDate || 0)));
    } catch (error) {
      console.error('Error loading jobs:', error);
      showToast('❌ Error loading jobs');
    }
    setLoading(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingJob) {
        await updateDoc(doc(db, 'jobs', editingJob.id), {
          ...formData,
          updatedAt: Timestamp.now(),
        });
        showToast('✅ Job updated successfully');
      } else {
        await addDoc(collection(db, 'jobs'), {
          ...formData,
          postedDate: Timestamp.now(),
          createdAt: Timestamp.now(),
        });
        showToast('✅ Job added successfully');
      }
      
      setShowAddModal(false);
      setEditingJob(null);
      resetForm();
      loadJobs();
    } catch (error) {
      console.error('Error saving job:', error);
      showToast('❌ Error saving job');
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      type: job.type || 'Full-time',
      category: job.category || 'IT/Software',
      salary: job.salary || '',
      description: job.description || '',
      requirements: job.requirements || '',
      applyLink: job.applyLink || '',
      logo: job.logo || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      showToast('✅ Job deleted successfully');
      loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('❌ Error deleting job');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      type: 'Full-time',
      category: 'IT/Software',
      salary: '',
      description: '',
      requirements: '',
      applyLink: '',
      logo: '',
    });
  };

  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e4e6eb' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
      <AdminSidebar />
      
      <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#e4e6eb' }}>
              💼 Manage Jobs
            </h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#a5b4fc' }}>
              Add, edit, and manage job postings
            </p>
          </div>
          <button
            onClick={() => {
              setEditingJob(null);
              resetForm();
              setShowAddModal(true);
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Add New Job
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search jobs by title, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#1a1f3a',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              color: '#e4e6eb',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ padding: '20px', background: '#1a1f3a', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>Total Jobs</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#6366f1' }}>{jobs.length}</div>
          </div>
          <div style={{ padding: '20px', background: '#1a1f3a', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>Filtered Results</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>{filteredJobs.length}</div>
          </div>
        </div>

        {/* Jobs List */}
        <div style={{ 
          background: '#1a1f3a',
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          overflow: 'hidden'
        }}>
          {filteredJobs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#a5b4fc' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '18px' }}>No jobs found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(99, 102, 241, 0.1)', borderBottom: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#e4e6eb', fontWeight: '600', fontSize: '14px' }}>Logo</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#e4e6eb', fontWeight: '600', fontSize: '14px' }}>Title</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#e4e6eb', fontWeight: '600', fontSize: '14px' }}>Company</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#e4e6eb', fontWeight: '600', fontSize: '14px' }}>Location</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#e4e6eb', fontWeight: '600', fontSize: '14px' }}>Type</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: '#e4e6eb', fontWeight: '600', fontSize: '14px' }}>Category</th>
                    <th style={{ padding: '16px', textAlign: 'right', color: '#e4e6eb', fontWeight: '600', fontSize: '14px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, index) => (
                    <tr key={job.id} style={{ 
                      borderBottom: index < filteredJobs.length - 1 ? '1px solid rgba(99, 102, 241, 0.1)' : 'none'
                    }}>
                      <td style={{ padding: '16px' }}>
                        {job.logo ? (
                          <img 
                            src={job.logo} 
                            alt={`${job.company} logo`}
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '6px',
                              objectFit: 'cover',
                              border: '1px solid rgba(99, 102, 241, 0.3)'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#fff',
                            border: '1px solid rgba(99, 102, 241, 0.3)'
                          }}>
                            {job.company?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: '#e4e6eb', fontSize: '14px', fontWeight: '600' }}>{job.title}</td>
                      <td style={{ padding: '16px', color: '#a5b4fc', fontSize: '14px' }}>{job.company}</td>
                      <td style={{ padding: '16px', color: '#a5b4fc', fontSize: '14px' }}>{job.location}</td>
                      <td style={{ padding: '16px', color: '#a5b4fc', fontSize: '14px' }}>{job.type}</td>
                      <td style={{ padding: '16px', color: '#a5b4fc', fontSize: '14px' }}>{job.category}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEdit(job)}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginRight: '8px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#1a1f3a',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#e4e6eb', fontSize: '24px' }}>
                {editingJob ? 'Edit Job' : 'Add New Job'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px'
                    }}
                  />
                </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                      Company Logo URL
                    </label>
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({...formData, logo: e.target.value})}
                      placeholder="https://example.com/logo.png"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0a0e27',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px',
                        color: '#e4e6eb',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0a0e27',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px',
                        color: '#e4e6eb',
                        fontSize: '14px'
                      }}
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Internship</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0a0e27',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px',
                        color: '#e4e6eb',
                        fontSize: '14px'
                      }}
                    >
                      <option>IT/Software</option>
                      <option>Design</option>
                      <option>Marketing</option>
                      <option>Sales</option>
                      <option>Finance</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                      Salary
                    </label>
                    <input
                      type="text"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      placeholder="e.g., $50k-$70k"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0a0e27',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px',
                        color: '#e4e6eb',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                    Requirements
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
                    Apply Link
                  </label>
                  <input
                    type="url"
                    value={formData.applyLink}
                    onChange={(e) => setFormData({...formData, applyLink: e.target.value})}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#0a0e27',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#e4e6eb',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingJob(null);
                      resetForm();
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'transparent',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {editingJob ? 'Update Job' : 'Add Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
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
            zIndex: 1001
          }}>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageJobs;
