// AdminMainDashboard.jsx - Main Admin Dashboard with User Profiles & Analytics
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { isAdmin } from '../../services/adminAuthService';
import AdminSidebar from '../Sidebar/AdminSidebar';
import './AdminDashboard.css';

const AdminMainDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalJobs: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState(null);

  // Check admin authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        navigate('/');
        return;
      }

      const adminStatus = await isAdmin(currentUser.uid);
      
      if (!adminStatus) {
        navigate('/userdash');
        return;
      }

      setAuthorized(true);
      loadDashboardData();
    };

    checkAuthorization();
  }, [navigate]);

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);

      // Load jobs
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const jobsData = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(jobsData);

      // Calculate analytics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const newUsersThisMonth = usersData.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
      }).length;

      setAnalytics({
        totalUsers: usersData.length,
        totalJobs: jobsData.length,
        activeUsers: usersData.filter(u => u.role !== 'super_admin').length,
        newUsersThisMonth,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  // Open user profile modal
  const openUserProfile = (user) => {
    setSelectedUser(user);
    setEditedUser({ ...user });
    setShowUserModal(true);
    setEditMode(false);
  };

  // Close modal
  const closeModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setEditedUser(null);
    setEditMode(false);
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!editedUser || !selectedUser) return;

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        name: editedUser.name,
        email: editedUser.email,
        role: editedUser.role,
        bio: editedUser.bio,
        institute: editedUser.institute,
        skills: editedUser.skills || [],
      });

      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editedUser } : u));
      setEditMode(false);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      closeModal();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e4e6eb' }}>
          <div className="loading-spinner">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
      <AdminSidebar />
      
      <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#e4e6eb' }}>
            🎯 Admin Dashboard
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#a5b4fc' }}>
            Manage users, analytics, and platform overview
          </p>
        </div>

        {/* Analytics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              {analytics.totalUsers}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>Total Users</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💼</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              {analytics.totalJobs}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>Total Jobs</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              {analytics.activeUsers}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>Active Users</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🆕</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              {analytics.newUsersThisMonth}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>New This Month</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#e4e6eb', marginBottom: '16px' }}>
            ⚡ Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/analytics')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              📊 View Analytics
            </button>
            <button
              onClick={() => navigate('/admin/jobs')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              💼 Manage Jobs
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ⚙️ API Settings
            </button>
            <button
              onClick={() => navigate('/ProfilePage')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              👤 My Profile
            </button>
          </div>
        </div>

        {/* User Profiles Grid */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#e4e6eb', marginBottom: '16px' }}>
            👥 User Profiles
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => openUserProfile(user)}
                style={{
                  background: 'linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
              >
                {/* Profile Picture */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: user.profilePicture 
                    ? `url(${user.profilePicture}) center/cover`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  color: '#fff',
                  fontWeight: '700',
                }}>
                  {!user.profilePicture && (user.name?.[0]?.toUpperCase() || '?')}
                </div>

                {/* User Info */}
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#e4e6eb',
                    margin: '0 0 8px 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {user.name || 'Unknown User'}
                  </h3>
                  
                  <p style={{
                    fontSize: '13px',
                    color: '#a5b4fc',
                    margin: '0 0 12px 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {user.email}
                  </p>

                  {/* Role Badge */}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: user.role === 'super_admin' 
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : 'rgba(99, 102, 241, 0.2)',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {user.role === 'super_admin' ? '👑 Admin' : '👤 User'}
                  </span>

                  {/* Institute */}
                  {user.institute && (
                    <p style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      margin: '8px 0 0 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      🏫 {user.institute}
                    </p>
                  )}

                  {/* Skills Count */}
                  {user.skills && user.skills.length > 0 && (
                    <p style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      margin: '4px 0 0 0',
                    }}>
                      🎯 {user.skills.length} Skills
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Modal */}
        {showUserModal && selectedUser && (
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
          }} onClick={closeModal}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }} onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#e4e6eb', margin: 0 }}>
                  👤 User Profile
                </h2>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#e4e6eb',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Profile Content (View Only) */}
              <div>
                {/* Profile Picture */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: selectedUser.profilePicture 
                    ? `url(${selectedUser.profilePicture}) center/cover`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  color: '#fff',
                  fontWeight: '700',
                }}>
                  {!selectedUser.profilePicture && (selectedUser.name?.[0]?.toUpperCase() || '?')}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a5b4fc', marginBottom: '4px' }}>Name</label>
                  <div style={{ fontSize: '16px', color: '#e4e6eb', padding: '8px 0' }}>{selectedUser.name}</div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a5b4fc', marginBottom: '4px' }}>Email</label>
                  <div style={{ fontSize: '16px', color: '#e4e6eb', padding: '8px 0' }}>{selectedUser.email}</div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a5b4fc', marginBottom: '4px' }}>Role</label>
                  <div style={{ fontSize: '16px', color: '#e4e6eb', padding: '8px 0' }}>
                    {selectedUser.role === 'super_admin' ? '👑 Admin' : '👤 User'}
                  </div>
                </div>

                {selectedUser.institute && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a5b4fc', marginBottom: '4px' }}>Institute</label>
                    <div style={{ fontSize: '16px', color: '#e4e6eb', padding: '8px 0' }}>{selectedUser.institute}</div>
                  </div>
                )}

                {selectedUser.bio && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a5b4fc', marginBottom: '4px' }}>Bio</label>
                    <div style={{ fontSize: '14px', color: '#e4e6eb', padding: '8px 0', lineHeight: 1.6 }}>
                      {selectedUser.bio}
                    </div>
                  </div>
                )}

                {selectedUser.skills && selectedUser.skills.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a5b4fc', marginBottom: '8px' }}>Skills</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedUser.skills.map((skill, idx) => (
                        <span key={idx} style={{
                          padding: '6px 12px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminMainDashboard;
