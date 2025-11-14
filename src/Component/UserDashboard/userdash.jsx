// src/Component/UserDashboard/userdash.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

// --- Firebase Imports ---
import { db, auth } from "./../../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// --- Asset Imports (adjust paths if necessary) ---
import job1 from "./../../Assets/frontend.jpg";
import job2 from "./../../Assets/webdev.jpg";
import job3 from "./../../Assets/uiux.jpg";
import job4 from "./../../Assets/data.jpg";
import course1 from "./../../Assets/data.jpg";
import course2 from "./../../Assets/design.jpg";
import course3 from "./../../Assets/digital.jpg";
import course4 from "./../../Assets/datasci.jpg";
import banner from "./../../Assets/banner.jpg";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/* ---------- PROFILE TEMPLATE (used when no profile doc exists) ---------- */
const PROFILE_TEMPLATE = {
  name: "New User",
  email: "",
  bio: "Aspiring software developer passionate about creating impactful solutions",
  profilePicture: "https://i.pravatar.cc/128?img=47",
  skills: ["JavaScript", "React"],
  basic: {
    location: "",
    availability: "",
    age: "",
    exp: "",
    DesiredSkill: ["Python", "Machine Learning", "Data Analysis"],
    rating: ""
  },
  projects: [
    {
      id: 1,
      title: "E-commerce Platform",
      description: "Built a full-stack shopping platform with React and Node.js",
    },
  ],
  careerGoals: "Seeking a frontend developer role...",
  cvText: "",
  courseProgress: {},
};

/* ---------------------------- UserDash Component --------------------------- */
export default function UserDash() {
  const navigate = useNavigate();

  // UI state
  const [currentView, setCurrentView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Auth & Profile
  const [currentUser, setCurrentUser] = useState(null); // firebase auth user
  const [user, setUser] = useState(null); // profile document from Firestore
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // Collections
  const [allJobs, setAllJobs] = useState([]);
  const [suggestedJobs, setSuggestedJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const [allCourses, setAllCourses] = useState([]);
  const [suggestedCourses, setSuggestedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Profile editing & toasts
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileTab, setProfileTab] = useState("basic");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Config - Dark Theme
  const defaultConfig = {
    app_title: "PathX",
    welcome_message: "Welcome back",
    jobs_section_title: "Featured Jobs",
    resources_section_title: "Learning Resources (For Your Goals)",
    primary_color: "#6366f1",
    secondary_color: "#0a0e27",
    text_color: "#e4e6eb",
    card_background: "#1a1f3a",
    accent_color: "#8b5cf6",
    font_family: "Inter, system-ui, -apple-system, sans-serif",
    font_size: 16,
  };
  const [config] = useState(defaultConfig);
  const baseFontSize = config.font_size || defaultConfig.font_size;

  // Helper function to create radial gradients for charts
  const createRadialGradient = (ctx, chartArea, color1, color2) => {
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const r = Math.min(
      (chartArea.right - chartArea.left) / 2,
      (chartArea.bottom - chartArea.top) / 2
    );
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, r);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  };

  // Chart sample data (keeps UI alive; data not persisted)
  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Applications",
        data: [3, 5, 4, 8, 6, 7],
        borderColor: "#6366f1",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
          gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.2)");
          gradient.addColorStop(1, "rgba(168, 85, 247, 0.05)");
          return gradient;
        },
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: { color: "#a5b4fc" },
        grid: { color: "rgba(99, 102, 241, 0.1)" }
      },
      x: {
        ticks: { color: "#a5b4fc" },
        grid: { display: false }
      }
    },
  };
  const doughnutData = {
    labels: ["JavaScript", "React", "Python", "Communication", "Problem Solving"],
    datasets: [
      {
        data: [90, 85, 70, 80, 88],
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          
          const gradients = [
            createRadialGradient(ctx, chartArea, '#60a5fa', '#3b82f6'),  // Blue gradient
            createRadialGradient(ctx, chartArea, '#34d399', '#10b981'),  // Green gradient
            createRadialGradient(ctx, chartArea, '#f472b6', '#ec4899'),  // Pink gradient
            createRadialGradient(ctx, chartArea, '#fbbf24', '#f59e0b'),  // Amber gradient
            createRadialGradient(ctx, chartArea, '#a78bfa', '#7c3aed'),  // Purple gradient
          ];
          return gradients[context.dataIndex];
        },
        borderWidth: 2,
        borderColor: '#0a0e27',
        hoverOffset: 12,
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff',
        spacing: 3,
      },
    ],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: "bottom",
        labels: {
          color: "#e4e6eb",
          font: { size: 12 },
          padding: 15,
        }
      } 
    },
  };
  const barData = {
    labels: ["React Basics", "Advanced JS", "System Design", "Algorithms"],
    datasets: [
      {
        label: "Progress %",
        data: [75, 45, 30, 60],
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          const colors = [
            ['#6366f1', '#8b5cf6'],
            ['#8b5cf6', '#a855f7'],
            ['#a855f7', '#c026d3'],
            ['#ec4899', '#f97316'],
          ];
          const [start, end] = colors[context.dataIndex] || colors[0];
          gradient.addColorStop(0, start);
          gradient.addColorStop(1, end);
          return gradient;
        },
        borderRadius: 8,
        borderWidth: 0,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false } 
    },
    scales: { 
      y: { 
        beginAtZero: true, 
        max: 100,
        ticks: { color: "#a5b4fc" },
        grid: { color: "rgba(99, 102, 241, 0.1)" }
      },
      x: {
        ticks: { color: "#a5b4fc" },
        grid: { display: false }
      }
    },
  };

  /* ------------------- Auth: listen for signed-in user ------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /* ---------------- Profile: read or create profile document -------------- */
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setProfileLoading(false);
      // optionally navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      setProfileLoading(true);
      const docRef = doc(db, "users", currentUser.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // merge template defaults (so missing keys exist)
          const data = docSnap.data();
          setUser({
            ...PROFILE_TEMPLATE,
            ...data,
            basic: {
              ...PROFILE_TEMPLATE.basic,
              ...data.basic
            }
          });
        } else {
          const newProfile = {
            ...PROFILE_TEMPLATE,
            email: currentUser.email || "",
            id: currentUser.uid,
            name: currentUser.displayName || PROFILE_TEMPLATE.name,
          };
          await setDoc(docRef, newProfile);
          setUser(newProfile);
        }
      } catch (err) {
        console.error("Error fetching/creating profile:", err);
        setToastMessage("Failed to load profile");
        setShowToast(true);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, authLoading]);

  /* ------------------ Fetch jobs & courses from Firestore ----------------- */
  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "jobs"));
        const jobsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllJobs(jobsData);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setToastMessage("Failed to load jobs");
        setShowToast(true);
      } finally {
        setJobsLoading(false);
      }
    };

    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "courses"));
        const coursesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllCourses(coursesData);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setToastMessage("Failed to load courses");
        setShowToast(true);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchJobs();
    fetchCourses();
  }, []);

  /* ---------------- Suggest jobs based on user's skills ------------------- */
  useEffect(() => {
    if (jobsLoading || profileLoading || !user) return;

    const userSkills = new Set((user.skills || []).map((s) => s.toLowerCase()));
    const filteredJobs = allJobs.filter((job) => {
      if (!job.skills || job.skills.length === 0) return false;
      return job.skills.some((req) => userSkills.has(req.toLowerCase()));
    });

    setSuggestedJobs(filteredJobs);
  }, [allJobs, user, jobsLoading, profileLoading]);

  /* --------------- Suggest courses based on desiredSkills --------------- */
  useEffect(() => {
    if (coursesLoading || profileLoading || !user) return;

    // Get desired skills from user.basic.DesiredSkill
    const desiredSkills = user.basic?.DesiredSkill || [];
    const desired = new Set(desiredSkills.map((s) => s.toLowerCase()));
    const filtered = allCourses.filter((course) => {
      // Check both 'relatedSkills' (from database) and 'skills' (for backward compatibility)
      const courseSkills = course.relatedSkills || course.skills || [];
      if (courseSkills.length === 0) return false;
      return courseSkills.some((cs) => desired.has(cs.toLowerCase()));
    });

    setSuggestedCourses(filtered);
  }, [allCourses, user, coursesLoading, profileLoading]);

  /* ---------------------------- Toast logic ----------------------------- */
  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  /* --------------------------- Helper funcs ---------------------------- */
  const getDocRef = () => {
    if (!currentUser) return null;
    return doc(db, "users", currentUser.uid);
  };

  const handleSaveProfile = async () => {
    const docRef = getDocRef();
    if (!docRef) return;
    setToastMessage("Saving...");
    setShowToast(true);
    try {
      await setDoc(docRef, user, { merge: true });
      setEditingProfile(false);
      setToastMessage("Profile updated successfully!");
      setShowToast(true);
    } catch (error) {
      console.error("Error saving profile:", error);
      setToastMessage("Error saving profile.");
      setShowToast(true);
    }
  };

  const handleAddSkill = async (skill) => {
    const docRef = getDocRef();
    if (!skill || !docRef) return;
    if ((user.skills || []).includes(skill)) return;
    const nextSkills = [...(user.skills || []), skill];
    setUser({ ...user, skills: nextSkills });
    try {
      await updateDoc(docRef, { skills: nextSkills });
    } catch (error) {
      setUser({ ...user, skills: user.skills || [] });
      setToastMessage("Error adding skill");
      setShowToast(true);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const docRef = getDocRef();
    if (!docRef) return;
    const currentSkills = user.skills || [];
    const nextSkills = currentSkills.filter((s) => s !== skillToRemove);
    setUser({ ...user, skills: nextSkills });
    try {
      await updateDoc(docRef, { skills: nextSkills });
    } catch (error) {
      setUser({ ...user, skills: currentSkills });
      setToastMessage("Error removing skill");
      setShowToast(true);
    }
  };

  const handleAddProject = async () => {
    const docRef = getDocRef();
    if (!docRef) return;
    const newProject = {
      id: Date.now(),
      title: "New Project",
      description: "Project description",
    };
    const nextProjects = [...(user.projects || []), newProject];
    setUser({ ...user, projects: nextProjects });
    try {
      await updateDoc(docRef, { projects: nextProjects });
    } catch (error) {
      setUser({ ...user, projects: user.projects || [] });
      setToastMessage("Error adding project");
      setShowToast(true);
    }
  };

  const handleUpdateProject = (id, field, value) => {
    setUser({
      ...user,
      projects: (user.projects || []).map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  };

  const handleRemoveProject = async (id) => {
    const docRef = getDocRef();
    if (!docRef) return;
    const currentProjects = user.projects || [];
    const nextProjects = currentProjects.filter((p) => p.id !== id);
    setUser({ ...user, projects: nextProjects });
    try {
      await updateDoc(docRef, { projects: nextProjects });
    } catch (error) {
      setUser({ ...user, projects: currentProjects });
      setToastMessage("Error removing project");
      setShowToast(true);
    }
  };

  /* ----------------------------- Loading UI ---------------------------- */
  if (authLoading || profileLoading || !user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: config.font_family,
          background: config.secondary_color,
        }}
      >
        Loading Your Dashboard...
      </div>
    );
  }

  /* ----------------------------- Main Render --------------------------- */
  return (
    <div
      style={{
        fontFamily: config.font_family,
        fontSize: `${baseFontSize}px`,
        background: config.secondary_color,
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex" }}>
        <aside
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            height: "100%",
            width: sidebarOpen ? 256 : 80,
            background: "linear-gradient(180deg, #1a1f3a 0%, #0f1420 100%)",
            borderRight: `1px solid rgba(99, 102, 241, 0.2)`,
            zIndex: 40,
            overflowY: "auto",
            boxShadow: "4px 0 20px rgba(0, 0, 0, 0.3)",
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
                    {config.app_title}
                  </span>
                </div>
              )}
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { id: "dashboard", label: "Dashboard", icon: "📊" },
                { id: "jobs", label: "Jobs", icon: "💼" },
                { id: "resources", label: "Resources", icon: "📚" },
                { id: "profile", label: "Profile", icon: "👤" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "profile") {
                      navigate("/ProfilePage");
                    } else if (item.id === "jobs") {
                      navigate("/jobs");
                    } else if (item.id === "resources") {
                      navigate("/courseList");
                    } else {
                      setCurrentView(item.id);
                    }
                  }}
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
                    color: currentView === item.id ? "#a5b4fc" : config.text_color,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: currentView === item.id ? "0 4px 15px rgba(99, 102, 241, 0.2)" : "none",
                  }}
                >
                  <span style={{ fontSize: baseFontSize * 1.25 }}>{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}

              <button
                onClick={() => {
                  auth.signOut();
                  navigate("/login");
                }}
                style={{
                  marginTop: 16,
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  padding: "12px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: baseFontSize * 1.25 }}>🚪</span>
                {sidebarOpen && <span>Logout</span>}
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
                border: `1px solid ${config.secondary_color}`,
                background: config.card_background,
              }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </aside>

        <main style={{ marginLeft: sidebarOpen ? 256 : 80, flex: 1, minHeight: "100vh" }}>
          <header
            style={{
              background: config.card_background,
              borderBottom: `1px solid ${config.secondary_color}`,
              padding: 16,
              position: "sticky",
              top: 0,
              zIndex: 30,
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 8,
                    borderRadius: 8,
                    border: `1px solid ${config.secondary_color}`,
                    background: config.card_background,
                  }}
                >
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    style={{ width: 32, height: 32, borderRadius: "50%" }}
                  />
                  <span style={{ color: config.text_color, fontWeight: 500 }}>{user.name}</span>
                </button>

                {profileDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      marginTop: 8,
                      width: 320,
                      background: config.card_background,
                      padding: 20,
                      borderRadius: 12,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12px" }}
                      />
                      <h3 style={{ margin: 0, fontWeight: 700 }}>{user.name}</h3>
                      <p style={{ margin: 0, color: "#6b7280" }}>{user.email}</p>
                    </div>
                    <p style={{ color: config.text_color }}>{user.bio}</p>
                    <button
                      onClick={() => {
                        navigate("/ProfilePage");
                        setProfileDropdownOpen(false);
                      }}
                      style={{
                        width: "100%",
                        padding: 10,
                        marginTop: 12,
                        background: config.primary_color,
                        color: "#fff",
                        borderRadius: 8,
                        border: "none",
                      }}
                    >
                      View Full Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div style={{ padding: 24 }}>
            {currentView === "dashboard" && (
              <DashboardView
                user={user}
                config={config}
                baseFontSize={baseFontSize}
                lineData={lineData}
                lineOptions={lineOptions}
                doughnutData={doughnutData}
                doughnutOptions={doughnutOptions}
                barData={barData}
                barOptions={barOptions}
                jobs={suggestedJobs}
                courses={suggestedCourses}
              />
            )}

            {currentView === "jobs" && <JobsView config={config} jobs={suggestedJobs} />}

            {currentView === "resources" && (
              <ResourcesView config={config} courses={suggestedCourses} user={user} />
            )}

            {currentView === "profile" && (
              <ProfileView
                user={user}
                setUser={setUser}
                editingProfile={editingProfile}
                setEditingProfile={setEditingProfile}
                profileTab={profileTab}
                setProfileTab={setProfileTab}
                handleSaveProfile={handleSaveProfile}
                handleAddSkill={handleAddSkill}
                handleRemoveSkill={handleRemoveSkill}
                handleAddProject={handleAddProject}
                handleUpdateProject={handleUpdateProject}
                handleRemoveProject={handleRemoveProject}
                config={config}
                baseFontSize={baseFontSize}
              />
            )}
          </div>
        </main>
      </div>

      {showToast && (
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            background: config.accent_color,
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 8,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function DashboardView({
  user,
  config,
  baseFontSize,
  lineData,
  lineOptions,
  doughnutData,
  doughnutOptions,
  barData,
  barOptions,
  jobs,
  courses,
}) {
  // Helper function to clean URLs - removes quotes and ensures proper protocol
  const cleanUrl = (url) => {
    if (!url) return null;
    // Remove surrounding quotes
    let cleaned = url.trim().replace(/^"+|"+$/g, '');
    // If URL doesn't start with http:// or https://, add https://
    if (cleaned && !cleaned.match(/^https?:\/\//i)) {
      cleaned = 'https://' + cleaned;
    }
    return cleaned;
  };

  const jobsWithImages = (jobs || []).map((job, i) => ({
    ...job,
    image: job.image || [job1, job2, job3, job4][i % 4],
  }));

  const coursesWithImages = (courses || []).map((res, i) => ({
    ...res,
    image: res.image || [course1, course2, course3, course4][i % 4],
  }));

  return (
    <div>
      {/* Welcome Banner - Dark Gradient */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1f3a 0%, #2d1b4e 50%, #1e1b3a 100%)",
          borderRadius: 20,
          padding: "50px 32px",
          color: "#fff",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(99, 102, 241, 0.4)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
        }}
      >
        <div 
          style={{ 
            position: "absolute", 
            inset: 0, 
            background: "radial-gradient(circle at top right, rgba(139, 92, 246, 0.2), transparent 60%)",
          }}
        ></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ 
            color: "#fff", 
            fontSize: baseFontSize * 2.2, 
            fontWeight: 700, 
            marginBottom: 12,
            textShadow: "0 2px 10px rgba(0,0,0,0.3)"
          }}>
            {config.welcome_message}, {user.name.split(" ")[0]} 👋
          </h2>
          <p style={{ 
            color: "rgba(255,255,255,0.85)", 
            fontSize: baseFontSize * 1.15,
            textShadow: "0 1px 3px rgba(0,0,0,0.2)"
          }}>
            Here's what's happening with your career journey today.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {[
          { label: "Total Jobs Applied", value: user.totalJobsApplied || 12, icon: "💼", color: "#6366f1" },
          { label: "Suggested Courses", value: courses.length, icon: "📚", color: "#8b5cf6" },
          { label: "Skills Count", value: (user.skills || []).length, icon: "⭐", color: "#f59e0b" },
          { label: "Profile Strength", value: `${user.profileStrength || 75}%`, icon: "📊", color: "#a855f7" },
        ].map((stat, idx) => (
          <div 
            key={idx} 
            style={{ 
              background: config.card_background, 
              padding: 24, 
              borderRadius: 16, 
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              border: `1px solid rgba(99, 102, 241, 0.2)`,
              borderTop: `4px solid ${stat.color}`,
              transition: "transform 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
              <span style={{ fontSize: baseFontSize * 2 }}>{stat.icon}</span>
              <div style={{ 
                width: 10, 
                height: 10, 
                borderRadius: 9999, 
                background: stat.color,
                boxShadow: `0 0 10px ${stat.color}80`
              }} />
            </div>
            <p style={{ fontSize: baseFontSize * 2, fontWeight: 700, color: config.text_color, margin: 0 }}>{stat.value}</p>
            <p style={{ color: "#a5b4fc", marginTop: 6, fontSize: baseFontSize * 0.95 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 32 }}>
        <div style={{ border: "1px solid black", borderTop: "4px solid #6366f1", background: config.card_background, padding: 24, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontWeight: 700, color: config.text_color }}>Job Applications Over Time</h3>
          <div style={{ height: 250 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div style={{ border: "1px solid black", borderTop: "4px solid #8b5cf6", background: config.card_background, padding: 24, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontWeight: 700, color: config.text_color }}>Skill Proficiency Breakdown</h3>
          <div style={{ height: 250 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        <div style={{ border: "1px solid black", borderTop: "4px solid #ec4899", background: config.card_background, padding: 24, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontWeight: 700, color: config.text_color }}>Learning Progress</h3>
          <div style={{ height: 250 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Jobs */}
      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: baseFontSize * 1.5, fontWeight: 700, color: config.text_color, marginBottom: 16 }}>
          {config.jobs_section_title} (Suggested for you)
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {jobsWithImages.length > 0 ? (
            jobsWithImages.slice(0, 4).map((job) => (
              <article key={job.id} style={{ background: config.card_background, padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: `1px solid ${config.secondary_color}` }}>
                <div style={{ width: "100%", height: 140, overflow: "hidden", borderRadius: 8, marginBottom: 12 }}>
                  <img src={job.image} alt={job.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 700, color: config.text_color }}>{job.title}</h4>
                <p style={{ color: "#6b7280", margin: "8px 0" }}>{job.company}</p>
                <p style={{ color: "#9ca3af", marginBottom: 12 }}>{job.location} • {job.type}</p>
                <button style={{ width: "100%", padding: 10, background: config.primary_color, color: "#fff", border: "none", borderRadius: 8 }}>Apply Now</button>
              </article>
            ))
          ) : (
            <p>No suggested jobs match your current skills. Add more skills to your profile!</p>
          )}
        </div>
      </section>

      {/* Courses */}
      <section>
        <h3 style={{ fontSize: baseFontSize * 1.5, fontWeight: 700, color: config.text_color, marginBottom: 16 }}>{config.resources_section_title}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {coursesWithImages.length > 0 ? (
            coursesWithImages.map((course) => {
              const progress = (user.courseProgress && user.courseProgress[course.id]) || 0;
              const skills = course.relatedSkills || course.skills || [];
              return (
                <article key={course.id} style={{ background: config.card_background, padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: `1px solid ${config.secondary_color}` }}>
                  <div style={{ width: "100%", height: 140, overflow: "hidden", borderRadius: 8, marginBottom: 12 }}>
                    <img src={course.image || course.logo} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 700, color: config.text_color }}>{course.title}</h4>
                  <p style={{ color: "#6b7280", margin: "8px 0" }}>{course.platform}</p>
                  {skills.length > 0 && (
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "4px 0" }}>Skills: {skills.join(", ")}</p>
                  )}
                  {course.costIndicator && (
                    <p style={{ margin: "4px 0" }}>
                      <span style={{ 
                        padding: "2px 8px", 
                        borderRadius: "12px", 
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        background: course.costIndicator === "Free" ? "#d1fae5" : "#fef3c7",
                        color: course.costIndicator === "Free" ? "#065f46" : "#92400e"
                      }}>
                        {course.costIndicator}
                      </span>
                    </p>
                  )}
                  <div style={{ marginBottom: 12, marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#6b7280" }}>Progress</span>
                      <span style={{ color: config.accent_color, fontWeight: 700 }}>{progress}%</span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: config.secondary_color, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${progress}%`, height: "100%", background: config.accent_color, transition: "width .3s" }} />
                    </div>
                  </div>
                  {course.url && (
                    <a href={cleanUrl(course.url)} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", padding: 10, background: config.primary_color, color: "#fff", border: "none", borderRadius: 8, textAlign: "center", textDecoration: "none" }}>View Course</a>
                  )}
                </article>
              );
            })
          ) : (
            <p>No suggested courses match your desired skills. Add desired skills in your profile!</p>
          )}
        </div>
      </section>
    </div>
  );
}

// JobsView
function JobsView({ config, jobs }) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredJobs = (jobs || []).filter(
    (job) =>
      (job.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.company || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ fontWeight: 700, color: config.text_color }}>Suggested Jobs</h2>
      <p style={{ color: "#6b7280", marginTop: -10, marginBottom: 20 }}>These jobs are recommended based on the skills in your profile.</p>
      <div style={{ marginBottom: 24 }}>
        <input placeholder="Search suggested jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", maxWidth: 500, padding: 12, borderRadius: 8, border: `1px solid ${config.secondary_color}`, background: config.card_background }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} style={{ background: config.card_background, padding: 24, borderRadius: 12, border: `1px solid ${config.secondary_color}` }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: config.text_color }}>{job.title}</h3>
              <p style={{ color: "#6b7280", margin: "8px 0" }}>{job.company}</p>
              <p style={{ color: "#9ca3af", marginBottom: 12 }}>📍 {job.location} • {job.type}</p>
              <button style={{ width: "100%", padding: 12, background: config.primary_color, color: "#fff", border: "none", borderRadius: 8 }}>Apply Now</button>
            </div>
          ))
        ) : (
          <p>No suggested jobs match your search. Try adding more skills to your profile!</p>
        )}
      </div>
    </div>
  );
}

// ResourcesView
function ResourcesView({ config, courses, user }) {

  const cleanUrl = (url) => {
    if (!url) return null;
  
    let cleaned = url.trim().replace(/^"+|"+$/g, '');

    if (cleaned && !cleaned.match(/^https?:\/\//i)) {
      cleaned = 'https://' + cleaned;
    }
    return cleaned;
  };

  const coursesWithImages = (courses || []).map((res, i) => ({
    ...res,
    image: res.image || res.logo || [course1, course2, course3, course4][i % 4],
  }));

  return (
    <div>
      <h2 style={{ fontWeight: 700, color: config.text_color }}>Suggested Learning Resources</h2>
      <p style={{ color: "#6b7280", marginTop: -10, marginBottom: 20 }}>These resources are recommended based on the desired skills in your profile.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {coursesWithImages.length > 0 ? (
          coursesWithImages.map((course) => {
            const progress = (user.courseProgress && user.courseProgress[course.id]) || 0;
            const skills = course.relatedSkills || course.skills || [];
            return (
              <div key={course.id} style={{ background: config.card_background, padding: 24, borderRadius: 12, border: `1px solid ${config.secondary_color}` }}>
                <div style={{ width: "100%", height: 160, overflow: "hidden", borderRadius: 8, marginBottom: 12 }}>
                  <img src={course.image || course.logo} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 700, color: config.text_color }}>{course.title}</h3>
                <p style={{ color: "#6b7280", margin: "8px 0" }}>Platform: {course.platform}</p>
                {skills.length > 0 && (
                  <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: "4px 0" }}>Skills: {skills.join(", ")}</p>
                )}
                {course.costIndicator && (
                  <p style={{ margin: "8px 0" }}>
                    <span style={{ 
                      padding: "4px 12px", 
                      borderRadius: "12px", 
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      background: course.costIndicator === "Free" ? "#d1fae5" : "#fef3c7",
                      color: course.costIndicator === "Free" ? "#065f46" : "#92400e"
                    }}>
                      {course.costIndicator}
                    </span>
                  </p>
                )}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#6b7280" }}>Progress</span>
                    <span style={{ color: config.accent_color, fontWeight: 700 }}>{progress}%</span>
                  </div>
                  <div style={{ width: "100%", height: 10, background: config.secondary_color, borderRadius: 5 }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: config.accent_color }} />
                  </div>
                </div>
                {course.url ? (
                  <a href={cleanUrl(course.url)} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", padding: 12, background: config.primary_color, color: "#fff", border: "none", borderRadius: 8, textAlign: "center", textDecoration: "none" }}>View Course</a>
                ) : (
                  <button style={{ width: "100%", padding: 12, background: config.primary_color, color: "#fff", border: "none", borderRadius: 8 }}>View Course</button>
                )}
              </div>
            );
          })
        ) : (
          <p>No suggested resources match your desired skills. Add desired skills in your profile!</p>
        )}
      </div>
    </div>
  );
}

// ProfileView
function ProfileView({
  user,
  setUser,
  editingProfile,
  setEditingProfile,
  profileTab,
  setProfileTab,
  handleSaveProfile,
  handleAddSkill,
  handleRemoveSkill,
  handleAddProject,
  handleUpdateProject,
  handleRemoveProject,
  config,
}) {
  const [newSkill, setNewSkill] = useState("");

  return (
    <div>
      <div style={{ background: config.card_background, padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontWeight: 700, color: config.text_color }}>Profile Settings</h2>
          {!editingProfile ? (
            <button onClick={() => setEditingProfile(true)} style={{ padding: "10px 20px", background: config.primary_color, color: "#fff", border: "none", borderRadius: 8 }}>Edit Profile</button>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setEditingProfile(false)} style={{ padding: "10px 20px", borderRadius: 8 }}>Cancel</button>
              <button onClick={handleSaveProfile} style={{ padding: "10px 20px", background: config.accent_color, color: "#fff", border: "none", borderRadius: 8 }}>Save Changes</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `2px solid ${config.secondary_color}`, flexWrap: "wrap" }}>
        {["basic", "skills", "projects", "career"].map((tab) => (
          <button key={tab} onClick={() => setProfileTab(tab)} style={{ padding: "12px 24px", border: "none", background: "transparent", color: profileTab === tab ? config.primary_color : "#6b7280", borderBottom: profileTab === tab ? `2px solid ${config.primary_color}` : "none", fontWeight: profileTab === tab ? 600 : 400 }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ background: config.card_background, padding: 24, borderRadius: 12 }}>
        {profileTab === "basic" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Name</label>
              <input value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} disabled={!editingProfile} style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${config.secondary_color}`, background: editingProfile ? config.card_background : config.secondary_color }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Email</label>
              <input value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} disabled={!editingProfile} style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${config.secondary_color}`, background: editingProfile ? config.card_background : config.secondary_color }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Bio</label>
              <textarea value={user.bio} onChange={(e) => setUser({ ...user, bio: e.target.value })} disabled={!editingProfile} rows={4} style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${config.secondary_color}`, background: editingProfile ? config.card_background : config.secondary_color }} />
            </div>
          </div>
        )}

        {profileTab === "skills" && (
          <div>
            {editingProfile && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8 }}>Add New Skill</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="e.g., JavaScript" style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${config.secondary_color}` }} />
                  <button onClick={() => { handleAddSkill(newSkill); setNewSkill(""); }} style={{ padding: "12px 24px", background: config.primary_color, color: "#fff", border: "none", borderRadius: 8 }}>Add</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {(user.skills || []).map((skill, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: `${config.primary_color}15`, color: config.primary_color, fontWeight: 600 }}>
                  {skill}
                  {editingProfile && (
                    <button onClick={() => handleRemoveSkill(skill)} style={{ background: "none", border: "none", fontSize: 16 }}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profileTab === "projects" && (
          <div>
            {editingProfile && <button onClick={handleAddProject} style={{ padding: "12px 24px", background: config.primary_color, color: "#fff", border: "none", borderRadius: 8, marginBottom: 12 }}>+ Add Project</button>}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {(user.projects || []).map((project) => (
                <div key={project.id} style={{ padding: 20, border: `1px solid ${config.secondary_color}`, borderRadius: 8 }}>
                  <input value={project.title} onChange={(e) => handleUpdateProject(project.id, "title", e.target.value)} disabled={!editingProfile} style={{ width: "100%", padding: 12, fontWeight: 700, marginBottom: 12 }} />
                  <textarea value={project.description} onChange={(e) => handleUpdateProject(project.id, "description", e.target.value)} disabled={!editingProfile} rows={3} style={{ width: "100%", padding: 12 }} />
                  {editingProfile && <button onClick={() => handleRemoveProject(project.id)} style={{ marginTop: 12, padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8 }}>Remove Project</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {profileTab === "career" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Career Goals</label>
              <textarea value={user.careerGoals} onChange={(e) => setUser({ ...user, careerGoals: e.target.value })} disabled={!editingProfile} rows={4} style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${config.secondary_color}`, background: editingProfile ? config.card_background : config.secondary_color }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8 }}>CV / Resume Notes</label>
              <textarea value={user.cvText} onChange={(e) => setUser({ ...user, cvText: e.target.value })} disabled={!editingProfile} rows={8} style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${config.secondary_color}`, fontFamily: "monospace", background: editingProfile ? config.card_background : config.secondary_color }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
