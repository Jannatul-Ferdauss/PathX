import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { isAdmin } from '../../services/adminAuthService';
import { useLanguage } from '../../context/LanguageContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    if (auth.currentUser) {
      const adminStatus = await isAdmin(auth.currentUser.uid);
      setUserIsAdmin(adminStatus);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/userdash') return 'dashboard';
    if (path === '/jobs') return 'jobs';
    if (path === '/courseList') return 'resources';
    if (path === '/roadmap') return 'roadmap';
    if (path === '/careerbot') return 'careerbot';
    if (path === '/ProfilePage') return 'profile';
    if (path === '/admin') return 'admin';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  return (
    <>
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100%",
          width: sidebarOpen ? 256 : 80,
          background: "linear-gradient(180deg, #1a1f3a 0%, #0f1420 100%)",
          borderRight: "1px solid rgba(99, 102, 241, 0.2)",
          zIndex: 40,
          overflowY: "auto",
          boxShadow: "4px 0 20px rgba(0, 0, 0, 0.3)",
          transition: "width 0.3s ease",
        }}
      >
        <div style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <svg
              style={{ width: 40, height: 40, filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))" }}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {sidebarOpen && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ 
                  fontWeight: "bold", 
                  fontSize: "1.3rem",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  PathX
                </span>
              </div>
            )}
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "dashboard", label: t('navbar.dashboard'), icon: "📊", path: "/userdash" },
              { id: "jobs", label: t('navbar.jobs'), icon: "💼", path: "/jobs" },
              { id: "resources", label: t('navbar.resources'), icon: "📚", path: "/courseList" },
              { id: "roadmap", label: t('navbar.roadmap'), icon: "🗺️", path: "/roadmap" },
              { id: "careerbot", label: t('navbar.careerMentor'), icon: "🤖", path: "/careerbot" },
              { id: "profile", label: t('navbar.profile'), icon: "👤", path: "/ProfilePage" },
              ...(userIsAdmin ? [{ id: "admin", label: t('navbar.admin'), icon: "🔧", path: "/admin" }] : []),
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    currentView === item.id 
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)" 
                      : "transparent",
                  color: currentView === item.id ? "#a5b4fc" : "#e4e6eb",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: currentView === item.id ? "0 4px 15px rgba(99, 102, 241, 0.2)" : "none",
                  fontSize: "1rem",
                  fontWeight: currentView === item.id ? 600 : 500,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (currentView !== item.id) {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== item.id) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
                background: "transparent",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#6366f1",
                padding: "12px 16px",
                borderRadius: 12,
                textAlign: "left",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>🌐</span>
              {sidebarOpen && <span>{language === 'en' ? 'বাংলা' : 'English'}</span>}
            </button>

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 8,
                background: "transparent",
                border: "none",
                color: "#ef4444",
                padding: "12px 16px",
                borderRadius: 12,
                textAlign: "left",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>🚪</span>
              {sidebarOpen && <span>{t('navbar.logout')}</span>}
            </button>
          </nav>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: 8,
              borderRadius: 8,
              border: "1px solid rgba(99, 102, 241, 0.3)",
              background: "#1a1f3a",
              color: "#6366f1",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "1rem",
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1a1f3a";
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </aside>
      
      {/* Spacer for content */}
      <div style={{ width: sidebarOpen ? 256 : 80 }} />
    </>
  );
}
