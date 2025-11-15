import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { isAdmin } from '../../services/adminAuthService';
import AdminSidebar from '../Sidebar/AdminSidebar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  getSDG8Analytics,
  getJobAnalytics,
  getGrowthTrends,
  getBangladeshJobMarketData,
} from '../../services/analyticsService';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const EnhancedAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [analytics, setAnalytics] = useState(null);
  const [jobAnalytics, setJobAnalytics] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [bdMarketData] = useState(getBangladeshJobMarketData());

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const adminStatus = await isAdmin(currentUser.uid);
    
    if (!adminStatus) {
      alert('⛔ Access Denied: Admin privileges required');
      navigate('/userdash');
      return;
    }

    setAuthorized(true);
    loadAllAnalytics();
  };

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const [sdgData, jobData, growthTrends] = await Promise.all([
        getSDG8Analytics(),
        getJobAnalytics(),
        getGrowthTrends(),
      ]);

      setAnalytics(sdgData);
      setJobAnalytics(jobData);
      setGrowthData(growthTrends);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  if (loading || !analytics || !jobAnalytics) {
    return (
      <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e4e6eb' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <div style={{ fontSize: '18px' }}>Loading Analytics Dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', background: '#0a0e27', minHeight: '100vh' }}>
      <AdminSidebar />
      
      <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#e4e6eb',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📊 Admin Dashboard - SDG 8 Impact Analytics
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#a5b4fc' }}>
            Promoting Decent Work and Economic Growth
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          borderBottom: '2px solid rgba(99, 102, 241, 0.2)',
          paddingBottom: '12px'
        }}>
          {['overview', 'skills', 'jobs', 'local-context', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                background: activeTab === tab 
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                  : 'transparent',
                color: activeTab === tab ? 'white' : '#a5b4fc',
                border: activeTab === tab ? 'none' : '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Key Metrics Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <MetricCard 
                icon="👥"
                title="Total Users"
                value={analytics.totalUsers}
                subtitle={`${analytics.engagementRate}% with skills`}
                color="#6366f1"
              />
              <MetricCard 
                icon="💼"
                title="Total Jobs"
                value={jobAnalytics.totalJobs}
                subtitle="Available opportunities"
                color="#10b981"
              />
              <MetricCard 
                icon="🎯"
                title="Skills Tracked"
                value={analytics.topSkills.length}
                subtitle="In-demand skills"
                color="#f59e0b"
              />
              <MetricCard 
                icon="📈"
                title="Engagement Rate"
                value={`${analytics.engagementRate}%`}
                subtitle="Active users"
                color="#8b5cf6"
              />
            </div>

            {/* Charts Row */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {/* Skills Demand Chart */}
              <ChartCard title="Top In-Demand Skills">
                <Bar 
                  data={{
                    labels: analytics.topSkills.slice(0, 8).map(([skill]) => skill),
                    datasets: [{
                      label: 'Users with Skill',
                      data: analytics.topSkills.slice(0, 8).map(([, count]) => count),
                      backgroundColor: 'rgba(99, 102, 241, 0.8)',
                      borderColor: 'rgba(99, 102, 241, 1)',
                      borderWidth: 1,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      title: { display: false }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: { color: '#a5b4fc' },
                        grid: { color: 'rgba(99, 102, 241, 0.1)' }
                      },
                      x: { 
                        ticks: { color: '#a5b4fc' },
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </ChartCard>

              {/* Experience Levels */}
              <ChartCard title="User Experience Distribution">
                <Doughnut 
                  data={{
                    labels: ['Entry Level', 'Mid Level', 'Senior Level'],
                    datasets: [{
                      data: [
                        analytics.experienceLevels.entry,
                        analytics.experienceLevels.mid,
                        analytics.experienceLevels.senior
                      ],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                      ],
                      borderWidth: 2,
                      borderColor: '#1a1f3a'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'bottom',
                        labels: { color: '#e4e6eb', padding: 15, font: { size: 12 } }
                      }
                    }
                  }}
                />
              </ChartCard>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {/* Skills Gap Analysis */}
              <ChartCard title="Most Desired Skills (Skill Gaps)">
                <Bar 
                  data={{
                    labels: analytics.topDesiredSkills.slice(0, 8).map(([skill]) => skill),
                    datasets: [{
                      label: 'Users Want to Learn',
                      data: analytics.topDesiredSkills.slice(0, 8).map(([, count]) => count),
                      backgroundColor: 'rgba(245, 158, 11, 0.8)',
                      borderColor: 'rgba(245, 158, 11, 1)',
                      borderWidth: 1,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: { color: '#a5b4fc' },
                        grid: { color: 'rgba(99, 102, 241, 0.1)' }
                      },
                      x: { 
                        ticks: { color: '#a5b4fc' },
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </ChartCard>

              {/* Skill Supply vs Demand */}
              <ChartCard title="Skill Supply vs Demand">
                <Bar 
                  data={{
                    labels: analytics.topSkills.slice(0, 6).map(([skill]) => skill),
                    datasets: [
                      {
                        label: 'Have Skill',
                        data: analytics.topSkills.slice(0, 6).map(([, count]) => count),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                      },
                      {
                        label: 'Want Skill',
                        data: analytics.topSkills.slice(0, 6).map(([skill]) => {
                          const desired = analytics.topDesiredSkills.find(([s]) => s === skill);
                          return desired ? desired[1] : 0;
                        }),
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        labels: { color: '#e4e6eb' },
                        position: 'top'
                      }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: { color: '#a5b4fc' },
                        grid: { color: 'rgba(99, 102, 241, 0.1)' }
                      },
                      x: { 
                        ticks: { color: '#a5b4fc' },
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </ChartCard>
            </div>

            {/* Skills Recommendations */}
            <div style={{ 
              marginTop: '24px',
              padding: '24px',
              background: '#1a1f3a',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#e4e6eb', fontSize: '18px' }}>
                💡 Training Recommendations
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {analytics.topDesiredSkills.slice(0, 10).map(([skill, count]) => (
                  <div key={skill} style={{
                    padding: '12px 16px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    color: '#e4e6eb',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontWeight: '600' }}>{skill}</div>
                    <div style={{ fontSize: '12px', color: '#a5b4fc', marginTop: '4px' }}>
                      {count} users want to learn
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <ChartCard title="Jobs by Category">
                <Pie 
                  data={{
                    labels: Object.keys(jobAnalytics.jobsByCategory),
                    datasets: [{
                      data: Object.values(jobAnalytics.jobsByCategory),
                      backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                      ],
                      borderWidth: 2,
                      borderColor: '#1a1f3a'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'right',
                        labels: { color: '#e4e6eb', padding: 12, font: { size: 11 } }
                      }
                    }
                  }}
                />
              </ChartCard>

              <ChartCard title="Jobs by Location">
                <Bar 
                  data={{
                    labels: Object.keys(jobAnalytics.jobsByLocation).slice(0, 8),
                    datasets: [{
                      label: 'Available Jobs',
                      data: Object.values(jobAnalytics.jobsByLocation).slice(0, 8),
                      backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      x: { 
                        beginAtZero: true,
                        ticks: { color: '#a5b4fc' },
                        grid: { color: 'rgba(99, 102, 241, 0.1)' }
                      },
                      y: { 
                        ticks: { color: '#a5b4fc' },
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </ChartCard>
            </div>
          </div>
        )}

        {/* Local Context Tab - Bangladesh Specific */}
        {activeTab === 'local-context' && (
          <div>
            <h2 style={{ color: '#e4e6eb', marginBottom: '20px' }}>
              🇧🇩 Bangladesh Job Market Context
            </h2>
            
            {/* Top Industries */}
            <div style={{ 
              padding: '24px',
              background: '#1a1f3a',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#e4e6eb' }}>
                📈 Top Growing Industries in Bangladesh
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {bdMarketData.topIndustries.map((industry, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#e4e6eb', marginBottom: '8px' }}>
                      {industry.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '4px' }}>
                      Growth: {industry.growth}
                    </div>
                    <div style={{ fontSize: '14px', color: '#a5b4fc' }}>
                      Demand: {industry.demand}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Government Initiatives */}
            <div style={{ 
              padding: '24px',
              background: '#1a1f3a',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#e4e6eb' }}>
                🏛️ Government Skills Development Initiatives
              </h3>
              {bdMarketData.governmentInitiatives.map((initiative, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#e4e6eb', marginBottom: '8px' }}>
                    {initiative.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>
                    {initiative.description}
                  </div>
                  <a href={initiative.url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: '14px',
                    color: '#6366f1',
                    textDecoration: 'none'
                  }}>
                    Visit Website →
                  </a>
                </div>
              ))}
            </div>

            {/* Regional Opportunities */}
            <div style={{ 
              padding: '24px',
              background: '#1a1f3a',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#e4e6eb' }}>
                🗺️ Regional Job Opportunities
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {Object.entries(bdMarketData.regionalOpportunities).map(([region, data]) => (
                  <div key={region} style={{
                    padding: '16px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#e4e6eb', marginBottom: '8px' }}>
                      {region}
                    </div>
                    <div style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '8px' }}>
                      Job Availability: {data.jobs}
                    </div>
                    <div style={{ fontSize: '13px', color: '#d1d5db' }}>
                      Key: {data.industries.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              <ChartCard title="User Location Distribution">
                <Bar 
                  data={{
                    labels: Object.keys(analytics.locationDistribution).slice(0, 10),
                    datasets: [{
                      label: 'Users',
                      data: Object.values(analytics.locationDistribution).slice(0, 10),
                      backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: { color: '#a5b4fc' },
                        grid: { color: 'rgba(99, 102, 241, 0.1)' }
                      },
                      x: { 
                        ticks: { color: '#a5b4fc' },
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </ChartCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, title, value, subtitle, color }) => (
  <div style={{
    padding: '24px',
    background: '#1a1f3a',
    borderRadius: '12px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  }}>
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
    <div style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '8px', fontWeight: '500' }}>
      {title}
    </div>
    <div style={{ fontSize: '32px', fontWeight: '800', color, marginBottom: '8px' }}>
      {value}
    </div>
    <div style={{ fontSize: '13px', color: '#d1d5db' }}>
      {subtitle}
    </div>
  </div>
);

// Chart Card Component
const ChartCard = ({ title, children }) => (
  <div style={{
    padding: '24px',
    background: '#1a1f3a',
    borderRadius: '12px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  }}>
    <h3 style={{ 
      margin: '0 0 20px 0', 
      color: '#e4e6eb', 
      fontSize: '16px',
      fontWeight: '600'
    }}>
      {title}
    </h3>
    <div style={{ height: '300px' }}>
      {children}
    </div>
  </div>
);

export default EnhancedAdminDashboard;
