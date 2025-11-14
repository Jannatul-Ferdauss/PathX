import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Firebase Imports ---
import { db, auth, storage } from "../../firebase"; 
// --- (Includes onSnapshot) ---
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Skill Extraction Component ---
import SkillExtractionDisplay from "../SkillExtraction/SkillExtractionDisplay";

const PROFILE_TEMPLATE = {
  id: "",
  name: "",
  title: "",
  rate: "",
  avatar: "https://i.pravatar.cc/300?img=47",
  bio: "",
  skills: [],
  careerInterests: "",
  basic: {
    location: "",
    availability: "",
    age: "",
    exp: "",
    desiredSkill: "", // Default is an empty string
    rating: ""
  },
  experiences: [],
  education: [],
  projects: [],
  cvLink: ""
};


export default function ProfilePage() {
  const navigate = useNavigate?.() || (() => {});
  
  const [currentUser, setCurrentUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true); 
  const [profile, setProfile] = useState(null); 
  const [profileLoading, setProfileLoading] = useState(true); 
  const [editing, setEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newDesiredSkill, setNewDesiredSkill] = useState("");
  const [editingBasic, setEditingBasic] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingExpId, setEditingExpId] = useState(null);
  const [tempExp, setTempExp] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [tempProject, setTempProject] = useState(null);
  const [editingEducationId, setEditingEducationId] = useState(null);
  const [tempEducation, setTempEducation] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState("profile");
  const [showSkillExtraction, setShowSkillExtraction] = useState(false);

  // (Auth Listener is unchanged)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); 
      setAuthLoading(false); 
    });
    return () => unsubscribe(); 
  }, []);

  // --- MODIFIED: This useEffect uses onSnapshot AND deep merges the profile ---
  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const profileId = currentUser.uid;
    const docRef = doc(db, "users", profileId);

    // This sets up the real-time listener
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        // --- START OF DEEP MERGE FIX ---
        const data = docSnap.data();
        setProfile({
          ...PROFILE_TEMPLATE, // 1. Start with all defaults
          ...data,             // 2. Override top-level fields (like 'name', 'bio')
          basic: {             // 3. Manually merge the 'basic' object
            ...PROFILE_TEMPLATE.basic, // ...start with basic defaults
            ...data.basic,             // ...override with remote basic data
          }
        });
        // --- END OF DEEP MERGE FIX ---
      } else {
        console.log("No profile document! Creating a new profile template.");
        setProfile({ ...PROFILE_TEMPLATE, id: profileId });
      }
      setProfileLoading(false);
    }, (error) => {
      // Handle any errors during listening
      console.error("Error listening to profile document:", error);
      setProfileLoading(false);
    });

    // Clean up the listener when the component unmounts or currentUser changes
    return () => {
      unsubscribe();
    };
  }, [currentUser]); // Dependency array is correct


  // (All functions below are unchanged)

  // (Skills function is unchanged)
  const addSkill = (value) => {
    const s = (value || "").trim();
    if (!s) return;
    if (!profile.skills.includes(s)) {
      setProfile((p) => ({ ...p, skills: [...p.skills, s] }));
      setNewSkill("");
    }
  };
  const removeSkill = (skill) => setProfile((p) => ({ ...p, skills: p.skills.filter((x) => x !== skill) }));

  // Desired Skills Management
  const addDesiredSkill = async (value) => {
    const s = (value || "").trim();
    if (!s) return;
    const currentDesiredSkills = profile.basic?.DesiredSkill || [];
    if (currentDesiredSkills.includes(s)) return;
    
    const updatedDesiredSkills = [...currentDesiredSkills, s];
    const updatedBasic = { ...profile.basic, DesiredSkill: updatedDesiredSkills };
    setProfile((p) => ({ ...p, basic: updatedBasic }));
    setNewDesiredSkill("");
    
    // Save to Firestore immediately
    if (!currentUser) return;
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { "basic.DesiredSkill": updatedDesiredSkills });
      setToast("Desired skill added!");
      setTimeout(() => setToast(null), 1500);
    } catch (error) {
      console.error("Error adding desired skill:", error);
      setProfile((p) => ({ ...p, basic: profile.basic }));
      setToast("Error adding skill");
      setTimeout(() => setToast(null), 1500);
    }
  };

  const removeDesiredSkill = async (skillToRemove) => {
    const currentDesiredSkills = profile.basic?.DesiredSkill || [];
    const updatedDesiredSkills = currentDesiredSkills.filter((s) => s !== skillToRemove);
    const updatedBasic = { ...profile.basic, DesiredSkill: updatedDesiredSkills };
    setProfile((p) => ({ ...p, basic: updatedBasic }));
    
    // Save to Firestore immediately
    if (!currentUser) return;
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { "basic.DesiredSkill": updatedDesiredSkills });
      setToast("Desired skill removed!");
      setTimeout(() => setToast(null), 1500);
    } catch (error) {
      console.error("Error removing desired skill:", error);
      setProfile((p) => ({ ...p, basic: profile.basic }));
      setToast("Error removing skill");
      setTimeout(() => setToast(null), 1500);
    }
  };

  // Update basic info field
  const updateBasicField = (field, value) => {
    setProfile((p) => ({
      ...p,
      basic: { ...p.basic, [field]: value }
    }));
  };

  // Save basic info
  const saveBasicInfo = async () => {
    if (!currentUser) return;
    setToast("Saving basic info...");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { basic: profile.basic });
      setEditingBasic(false);
      setToast("Basic info saved!");
      setTimeout(() => setToast(null), 1500);
    } catch (error) {
      console.error("Error saving basic info:", error);
      setToast("Error saving basic info");
      setTimeout(() => setToast(null), 1500);
    }
  };

  // --- Helper Functions (Experience) ---
  const startAddExperience = () => {
    setTempExp({ id: Date.now(), company: "", role: "", date: "", location: "", description: "" });
    setEditingExpId(null);
  };
  const startEditExperience = (exp) => {
    setTempExp({ ...exp });
    setEditingExpId(exp.id);
  };

  // --- saveExperience (unchanged) ---
  const saveExperience = async () => {
    if (!tempExp) return;
    if (!tempExp.company || !tempExp.role) {
      alert("Please fill company and role.");
      return;
    }

    let nextExperiences;
    const exists = profile.experiences.find((e) => e.id === tempExp.id);
    if (exists) {
      nextExperiences = profile.experiences.map((e) => (e.id === tempExp.id ? tempExp : e));
    } else {
      nextExperiences = [...profile.experiences, tempExp];
    }

    setProfile((p) => ({ ...p, experiences: nextExperiences }));
    setTempExp(null);
    setEditingExpId(null);

    if (!currentUser) return;
    setToast("Saving experience...");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { experiences: nextExperiences });
      setToast("Experience saved!");
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      setToast("Error saving.");
      console.error(err);
    }
  };

  // --- deleteExperience (unchanged) ---
  const deleteExperience = async (expId) => {
    if (!window.confirm("Remove this entry?")) return;

    const nextExperiences = profile.experiences.filter((e) => e.id !== expId);
    setProfile((p) => ({ ...p, experiences: nextExperiences }));

    if (!currentUser) return;
    setToast("Deleting experience...");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { experiences: nextExperiences });
      setToast("Experience deleted.");
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      setToast("Error deleting.");
      console.error(err);
    }
  };

  // --- Helper Functions (Projects) --- 
  const startAddProject = () => {
    setTempProject({ id: Date.now(), name: "", tech: "", date: "", link: "", description: "" });
    setEditingProjectId(null);
  };
  const startEditProject = (proj) => {
    setTempProject({ ...proj });
    setEditingProjectId(proj.id);
  };

  // --- saveProject (unchanged) ---
  const saveProject = async () => {
    if (!tempProject) return;
    if (!tempProject.name || !tempProject.tech) {
      alert("Please fill name and tech.");
      return;
    }

    let nextProjects;
    const exists = profile.projects.find((e) => e.id === tempProject.id);
    if (exists) {
      nextProjects = profile.projects.map((e) => (e.id === tempProject.id ? tempProject : e));
    } else {
      nextProjects = [...profile.projects, tempProject];
    }

    setProfile((p) => ({ ...p, projects: nextProjects }));
    setTempProject(null);
    setEditingProjectId(null);

    if (!currentUser) return;
    setToast("Saving project...");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { projects: nextProjects });
      setToast("Project saved!");
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      setToast("Error saving.");
      console.error(err);
    }
  };

  // --- deleteProject (unchanged) ---
  const deleteProject = async (projId) => {
    if (!window.confirm("Remove this entry?")) return;

    const nextProjects = profile.projects.filter((e) => e.id !== projId);
    setProfile((p) => ({ ...p, projects: nextProjects }));

    if (!currentUser) return;
    setToast("Deleting project...");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { projects: nextProjects });
      setToast("Project deleted.");
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      setToast("Error deleting.");
      console.error(err);
    }
  };

  // --- Helper Functions (Education) --- 
  const startAddEducation = () => {
    setTempEducation({ id: Date.now(), school: "", degree: "", date: "", location: "", description: "" });
    setEditingEducationId(null);
  };
  const startEditEducation = (edu) => {
    setTempEducation({ ...edu });
    setEditingEducationId(edu.id);
  };

  // --- saveEducation (unchanged) ---
  const saveEducation = async () => {
    if (!tempEducation) return;
    if (!tempEducation.school || !tempEducation.degree) {
      alert("Please fill school and degree.");
      return;
    }

    let nextEducation;
    const exists = profile.education.find((e) => e.id === tempEducation.id);
    if (exists) {
      nextEducation = profile.education.map((e) => (e.id === tempEducation.id ? tempEducation : e));
    } else {
      nextEducation = [...profile.education, tempEducation];
    }

    setProfile((p) => ({ ...p, education: nextEducation }));
    setTempEducation(null);
    setEditingEducationId(null);

    if (!currentUser) return;
    setToast("Saving education entry...");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { education: nextEducation });
      setToast("Education saved!");
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      setToast("Error saving.");
      console.error(err);
    }
  };

  // --- deleteEducation (unchanged) ---
  const deleteEducation = async (eduId) => {
    if (!window.confirm("Remove this entry?")) return;

    const nextEducation = profile.education.filter((e) => e.id !== eduId);
    setProfile((p) => ({ ...p, education: nextEducation }));

    if (!currentUser) return;
    setToast("Deleting education entry...");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { education: nextEducation });
      setToast("Education deleted.");
      setTimeout(() => setToast(null), 1500);
    } catch (err) {
      setToast("Error deleting.");
      console.error(err);
    }
  };


  // (CV Upload function is unchanged)
  const handleCvUpload = async () => {
    if (!cvFile || !currentUser) return;
    setCvUploading(true);
    setToast("Uploading CV...");

    const storageRef = ref(storage, `cvs/${currentUser.uid}/${cvFile.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, cvFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, { cvLink: downloadURL });

      setProfile(p => ({ ...p, cvLink: downloadURL }));
      
      setToast("CV Uploaded!");
      setTimeout(() => setToast(null), 2000);
      setCvFile(null); 
    } catch (error) {
      console.error("Error uploading CV:", error);
      setToast("Upload failed.");
      setTimeout(() => setToast(null), 1500);
    }
    setCvUploading(false);
  };

  // (Other helpers unchanged)
  const updateCareerInterests = (value) => {
    setProfile((p) => ({ ...p, careerInterests: value }));
  };
  const upd = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  // --- Save to Firestore (unchanged) ---
  const handleSaveProfile = async () => {
    if (!currentUser) {
      alert("Error: You must be logged in to save.");
      return;
    }
    
    setToast("Saving profile...");
    try {
      const docRef = doc(db, "users", currentUser.uid); 
      
      // Using setDoc with merge: true will save *all* local state changes.
      await setDoc(docRef, profile, { merge: true }); 
      
      setEditing(false);
      setToast("Profile saved!");
      const c = document.querySelector(".content");
      if (c) c.scrollTop = 0;
      setTimeout(() => setToast(null), 1500);

    } catch (error) {
      console.error("Error saving to Firestore: ", error);
      setToast("Error saving profile.");
      setTimeout(() => setToast(null), 2000);
    }
  };

  
  // (Loading/Error states are unchanged)
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', fontSize: '1.2rem', background: '#0a0e27', color: '#e4e6eb' }}>
        Checking authentication...
      </div>
    );
  }
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', fontSize: '1.2rem', background: '#0a0e27', color: '#e4e6eb' }}>
        Please log in to view your profile.
      </div>
    );
  }
  if (profileLoading || !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', fontSize: '1.2rem', background: '#0a0e27', color: '#e4e6eb' }}>
        Loading Profile...
      </div>
    );
  }

  // --- Main Render (Your Original JSX) ---
  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif", fontSize: "16px", margin: 0, padding: 0, minHeight: "100vh", boxSizing: "border-box", background: "#0a0e27" }}>
      <div style={{ display: "flex", margin: 0, padding: 0 }}>
        {/* Sidebar (unchanged) */}
        <aside style={{ position: "fixed", left: 0, top: 0, height: "100%", width: sidebarOpen ? 256 : 80, background: "linear-gradient(180deg, #1a1f3a 0%, #0f1420 100%)", borderRight: "1px solid rgba(99, 102, 241, 0.2)", boxShadow: "4px 0 20px rgba(0, 0, 0, 0.3)", zIndex: 40, overflowY: "auto", boxSizing: "border-box" }}>
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <svg style={{ width: 40, height: 40, filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))" }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" > <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> </svg>
              {sidebarOpen && ( <div style={{ display: "flex", alignItems: "center", gap: 8 }}> <span style={{ fontWeight: "bold", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontSize: "1.3rem" }}>PathX</span> </div> )}
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { id: "dashboard", label: "Dashboard", icon: "📊", path: "/userdash" },
                { id: "jobs", label: "Jobs", icon: "💼", path: "/userdash" },
                { id: "resources", label: "Resources", icon: "📚", path: "/userdash" },
                { id: "profile", label: "Profile", icon: "👤", path: "/profile" } 
              ].map(item => (
                <button key={item.id} onClick={() => { setCurrentView(item.id); try { navigate(item.path); } catch{} }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "none", background: currentView === item.id ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)" : "transparent", color: currentView === item.id ? "#a5b4fc" : "#e4e6eb", cursor: "pointer", transition: "all 0.2s ease", fontWeight: currentView === item.id ? 600 : 500, boxShadow: currentView === item.id ? "0 4px 15px rgba(99, 102, 241, 0.2)" : "none", textAlign: "left" }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: 8, borderRadius: 8, border: "1px solid #0a0e27", background: "#1a1f3a", color: "#6366f1", cursor: "pointer", transition: "all 0.3s ease", fontWeight: 600, boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)" }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ marginLeft: sidebarOpen ? 256 : 80, flex: 1, minHeight: "100vh", width: `calc(100vw - ${sidebarOpen ? 256 : 80}px)`, overflow: "hidden", boxSizing: "border-box" }}>
          {/* Embedded <style> (unchanged) */}
          <style>{`
            :root{ --bg:#0a0e27; --panel:#1a1f3a; --muted:#a5b4fc; --accent:#6366f1; --soft-border:rgba(99, 102, 241, 0.2); --card-radius:12px; }
            .content { display:grid; grid-template-columns:300px 1fr; gap:24px; padding:20px; background:var(--bg); min-height:100vh; box-sizing:border-box; }
            .card { background:var(--panel); border-radius:12px; padding:18px; box-shadow:0 8px 20px rgba(0,0,0,0.3); border:1px solid rgba(99, 102, 241, 0.3); box-sizing:border-box; }
            .profile-card { display:flex; flex-direction:column; gap:12px; align-items:center; text-align:center; box-sizing:border-box; border:1px solid rgba(99, 102, 241, 0.3); }
            .avatar-wrap { width:132px; height:132px; border-radius:999px; padding:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(99, 102, 241, 0.3); background:linear-gradient(180deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05)); }
            .avatar-wrap img{ width:100%; height:100%; object-fit:cover; border-radius:999px; display:block; }
            h2.profile-name{ margin:0; font-size:18px; font-weight:800; color:#e4e6eb; }
            p.profile-role{ margin:6px 0 0; font-size:13px; color:var(--muted); }
            .rate{ margin-top:8px; color:var(--accent); font-weight:700; }
            .profile-bio{ color:#d1d5db; font-size:13px; line-height:1.5; text-align:left; }
            .skills { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-top:6px; }
            .chip{ background:rgba(99, 102, 241, 0.1); border:1px solid rgba(99, 102, 241, 0.3); color:#e4e6eb; padding:6px 10px; border-radius:999px; font-size:12px; display:inline-flex; align-items:center; gap:8px; }
            .basic-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:start; }
            .label{ color:var(--muted); font-size:13px; font-weight:600; }
            .value{ color:#e4e6eb; font-weight:700; font-size:14px; margin-top:6px; }
            .actions-row{ margin-top:14px; display:flex; gap:12px; align-items:center; }
            .btn{ padding:10px 14px; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; border:none; }
            .btn.primary{ background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color:white; box-shadow:0 10px 26px rgba(99, 102, 241, 0.4); }
            .btn.ghost{ background:transparent; color:var(--accent); border:1px solid rgba(99, 102, 241, 0.3); }
            .tab-head{ display:flex; gap:14px; align-items:center; border-bottom:1px solid rgba(99, 102, 241, 0.2); padding-bottom:10px; margin-top:12px; }
            .tab-head button{ background:transparent; border:none; padding:8px 6px; cursor:pointer; font-weight:700; color:var(--muted); position:relative; }
            .tab-head button.active{ color:var(--accent); }
            .tab-head button.active::after{ content:''; position:absolute; bottom:-10px; left:0; right:0; height:3px; background:#6366f1; border-radius:2px; }
            .exp-item{ display:flex; justify-content:space-between; gap:12px; padding:14px; border-radius:8px; background:rgba(26, 31, 58, 0.6); border:1px solid rgba(99, 102, 241, 0.2); }
            input, textarea, select { width:100%; box-sizing:border-box; padding:10px 12px; border-radius:8px; border:1px solid rgba(99, 102, 241, 0.3); background:rgba(26, 31, 58, 0.6); font-size:13px; color:#e4e6eb; }
            .mb-2 { margin-bottom: 8px; } /* Helper class */
            @media (max-width:1100px) { .content { grid-template-columns:1fr; } .content > aside:nth-child(1) { order: 1 } .content > main { order: 2 } }
          `}</style>
          
          <div className="content">
            {/* LEFT (unchanged) */}
            <aside className="card profile-card" style={{ boxSizing: "border-box" }} aria-labelledby="profile-title">
              <div className="avatar-wrap" style={{ boxSizing: "border-box" }}>
                <img 
                  src={profile.avatar || "https://i.pravatar.cc/300?img=47"} 
                  alt={profile.name || "User"} 
                  onError={(e) => { e.target.src = "https://i.pravatar.cc/300?img=47"; }}
                  style={{ border: "2px solid rgba(99, 102, 241, 0.3)" }}
                />
              </div>
              {editing ? (
                <>
                  <input value={profile.name} onChange={(e) => upd("name", e.target.value)} />
                  <input value={profile.title} onChange={(e) => upd("title", e.target.value)} style={{ marginTop: 6 }} />
                </>
              ) : (
                <>
                  <h2 id="profile-title" className="profile-name">{profile.name || "—"}</h2>
                  <p className="profile-role">{profile.title || "—"}</p>
                </>
              )}
              <div className="rate">{editing ? <input value={profile.rate} onChange={(e) => upd("rate", e.target.value)} /> : <div className="rate">{profile.rate || "—"}</div>}</div>
              
              <div style={{ width: "100%" }}>
                <h4 style={{ margin: 0, fontSize: 13, color: "#a5b4fc" }}>Summary</h4>
                {editing ? (
                  <textarea className="mt-2" rows={4} value={profile.bio} onChange={(e) => upd("bio", e.target.value)} />
                ) : (
                  <p className="profile-bio" style={{ marginTop: 8 }}>{profile.bio || "No summary provided."}</p>
                )}
              </div>

              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 13, color: "#a5b4fc" }}>Skills</h4>
                  {!editing && (
                    <button 
                      onClick={() => setShowSkillExtraction(true)} 
                      className="btn primary"
                      style={{ 
                        padding: "6px 12px", 
                        fontSize: 12,
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                      title="Extract skills from your CV using AI"
                    >
                      🤖 Extract from CV
                    </button>
                  )}
                </div>
                <div className="skills">
                  {profile.skills.map((s) => (
                    <div key={s} className="chip">
                      <span>{s}</span>
                      {editing && (
                        <button onClick={() => removeSkill(s)} aria-label={`Remove ${s}`} style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer" }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
                {editing && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <input className="flex-1" placeholder="Add a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(newSkill); } }} />
                    <button onClick={() => addSkill(newSkill)} className="btn primary">Add</button>
                  </div>
                )}
              </div>

              <div style={{ width: "100%", display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => setEditing((v) => !v)} className={`btn ${editing ? "ghost" : "primary"}`}>
                  {editing ? "Exit Edit" : "Edit Profile"}
                </button>
                <button onClick={handleSaveProfile} className="btn ghost">Save</button>
              </div>
            </aside>

            {/* CENTER */}
            <main className="card" style={{ minHeight: 200, boxSizing: "border-box", overflow: "auto" }}>
              {/* Basic Info - Now Editable */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontWeight: 700, color: "#e4e6eb" }}>Basic Information</h4>
                    {!editingBasic ? (
                      <button onClick={() => setEditingBasic(true)} className="btn primary" style={{ padding: "6px 12px", fontSize: 12 }}>Edit</button>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditingBasic(false)} className="btn ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Cancel</button>
                        <button onClick={saveBasicInfo} className="btn primary" style={{ padding: "6px 12px", fontSize: 12 }}>Save</button>
                      </div>
                    )}
                  </div>
                  <div className="basic-grid" style={{ marginTop: 12 }}>
                    <div>
                      <div className="label">Location</div>
                      {editingBasic ? (
                        <input className="mb-2" value={profile.basic?.location || ""} onChange={(e) => updateBasicField("location", e.target.value)} placeholder="Enter location" />
                      ) : (
                        <div className="value">{profile.basic?.location || "—"}</div>
                      )}
                      
                      <div className="label" style={{ marginTop: 8 }}>Availability</div>
                      {editingBasic ? (
                        <input className="mb-2" value={profile.basic?.availability || ""} onChange={(e) => updateBasicField("availability", e.target.value)} placeholder="e.g., Full-time" />
                      ) : (
                        <div className="value">{profile.basic?.availability || "—"}</div>
                      )}
                      
                      <div className="label" style={{ marginTop: 8 }}>Age</div>
                      {editingBasic ? (
                        <input className="mb-2" value={profile.basic?.age || ""} onChange={(e) => updateBasicField("age", e.target.value)} placeholder="Enter age" />
                      ) : (
                        <div className="value">{profile.basic?.age || "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="label">Experience</div>
                      {editingBasic ? (
                        <input className="mb-2" value={profile.basic?.exp || ""} onChange={(e) => updateBasicField("exp", e.target.value)} placeholder="e.g., 2 years" />
                      ) : (
                        <div className="value">{profile.basic?.exp || "—"}</div>
                      )}
                      
                      <div className="label" style={{ marginTop: 8 }}>Positive Feedback</div>
                      {editingBasic ? (
                        <input className="mb-2" value={profile.basic?.rating || ""} onChange={(e) => updateBasicField("rating", e.target.value)} placeholder="e.g., 4.5" />
                      ) : (
                        <div className="value">{profile.basic?.rating ? `${profile.basic.rating} ★` : "—"}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Desired Skills Section - Always Editable */}
                  <div style={{ marginTop: 16, padding: 12, background: "rgba(26, 31, 58, 0.6)", borderRadius: 8, border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                    <div className="label" style={{ fontWeight: 700, marginBottom: 8, color: "#e4e6eb" }}>Desired Skills (For Learning Resources)</div>
                    <div className="skills" style={{ marginBottom: 8 }}>
                      {Array.isArray(profile.basic?.DesiredSkill) && profile.basic.DesiredSkill.length > 0 ? (
                        profile.basic.DesiredSkill.map((skill) => (
                          <div key={skill} className="chip" style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#e4e6eb" }}>
                            <span>{skill}</span>
                            <button onClick={() => removeDesiredSkill(skill)} aria-label={`Remove ${skill}`} style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 16, fontWeight: "bold" }}>×</button>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: 12, color: "#a5b4fc", margin: 0 }}>No desired skills added yet. Add skills to get personalized learning recommendations!</p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input 
                        className="flex-1" 
                        placeholder="Add a skill you want to learn" 
                        value={newDesiredSkill} 
                        onChange={(e) => setNewDesiredSkill(e.target.value)} 
                        onKeyDown={(e) => { 
                          if (e.key === "Enter") { 
                            e.preventDefault(); 
                            addDesiredSkill(newDesiredSkill); 
                          } 
                        }} 
                        style={{ fontSize: 13 }}
                      />
                      <button onClick={() => addDesiredSkill(newDesiredSkill)} className="btn primary" style={{ padding: "8px 16px", fontSize: 13 }}>Add</button>
                    </div>
                    <p style={{ fontSize: 11, color: "#a5b4fc", margin: "8px 0 0 0", fontStyle: "italic" }}>💡 These skills will be used to recommend courses in your dashboard</p>
                  </div>
                </div>
                <div style={{ minWidth: 120, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(profile)).then(()=>alert("Profile JSON copied")); }} className="btn ghost">Export (JSON)</button>
                </div>
              </div>

              {/* Tabs (All props are passed correctly now) */}
              <Tabs
                experiences={profile.experiences || []}
                onStartAdd={startAddExperience}
                onEdit={startEditExperience}
                onDelete={deleteExperience}
                tempExp={tempExp}
                setTempExp={setTempExp}
                saveExperience={saveExperience}
                editingExpId={editingExpId}
                
                projects={profile.projects || []}
                onStartAddProject={startAddProject}
                onEditProject={startEditProject}
                onDeleteProject={deleteProject}
                tempProject={tempProject}
                setTempProject={setTempProject}
                saveProject={saveProject}
                editingProjectId={editingProjectId}

                education={profile.education || []}
                onStartAddEducation={startAddEducation}
                onEditEducation={startEditEducation}
                onDeleteEducation={deleteEducation}
                tempEducation={tempEducation}
                setTempEducation={setTempEducation}
                saveEducation={saveEducation}
                editingEducationId={editingEducationId}
              />
              
              {/* Career Interests (unchanged) */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: 0, fontWeight: 700, color: "#e4e6eb" }}>Career Interests</h4>
                <textarea rows={3} value={profile.careerInterests || ""} onChange={(e) => updateCareerInterests(e.target.value)} style={{ marginTop: 8 }} />
              </div>

              {/* CV File Upload (unchanged) */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: 0, fontWeight: 700, color: "#e4e6eb" }}>CV / Resume</h4>
                {profile.cvLink ? (
                  <div style={{ marginTop: 8 }}>
                    <a href={profile.cvLink} target="_blank" rel="noreferrer" style={{ color: "#6366f1", fontWeight: 600 }}>
                      View Current CV
                    </a>
                  </div>
                ) : (
                  <p style={{ color: "#a5b4fc", marginTop: 8, fontSize: 14 }}>No CV uploaded.</p>
                )}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setCvFile(e.target.files[0])} 
                    style={{ fontSize: 13 }}
                  />
                  <button 
                    className="btn primary" 
                    onClick={handleCvUpload}
                    disabled={!cvFile || cvUploading}
                  >
                    {cvUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#a5b4fc", margin: "8px 0 0 0" }}>
                  Note: Uploading CV saves it immediately.
                </p>
              </div>
            </main>
          </div>

          {/* toast (unchanged) */}
          {toast && (
            <div style={{ position: "fixed", right: 24, bottom: 24, background: "#0f172a", color: "#fff", padding: "10px 14px", borderRadius: 10, boxShadow: "0 8px 30px rgba(2,6,23,0.3)" }}>
              {toast}
            </div>
          )}
        </main>
      </div>

      {/* Skill Extraction Modal */}
      {showSkillExtraction && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: 20,
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSkillExtraction(false);
            }
          }}
        >
          <div
            style={{
              maxWidth: 700,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <SkillExtractionDisplay
              currentProfile={profile}
              onSkillsExtracted={(data) => {
                // Skills are already saved to Firebase by the component
                // Just show success message and refresh will happen via onSnapshot
                setToast(`✅ Added ${data.skills.length - (profile.skills?.length || 0)} new skills!`);
                setTimeout(() => setToast(null), 2000);
                setShowSkillExtraction(false);
              }}
              onClose={() => setShowSkillExtraction(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------ Tabs component (Unchanged) ------------------ */
function Tabs({ 
  experiences = [], onStartAdd, onEdit, onDelete, tempExp, setTempExp, saveExperience, editingExpId,
  projects = [], onStartAddProject, onEditProject, onDeleteProject, tempProject, setTempProject, saveProject, editingProjectId,
  education = [], onStartAddEducation, onEditEducation, onDeleteEducation, tempEducation, setTempEducation, saveEducation, editingEducationId
}) {
  const [active, setActive] = useState("experience");
  return (
    <div style={{ marginTop: 18 }}>
      <div className="tab-head" role="tablist" aria-label="Profile tabs">
        <button className={active === "experience" ? "active" : ""} onClick={() => setActive("experience")}>Experience</button>
        <button className={active === "projects" ? "active" : ""} onClick={() => setActive("projects")}>Projects</button>
        <button className={active === "education" ? "active" : ""} onClick={() => setActive("education")}>Education</button>
      </div>
      <div style={{ marginTop: 12 }}>
        
        {/* --- Experience Tab --- */}
        {active === "experience" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: "#e4e6eb" }}>Work Experience</h5>
              <div>
                <button onClick={onStartAdd} className="btn primary">+ Add</button>
              </div>
            </div>
            {experiences.length === 0 ? (
              <div style={{ color: "#a5b4fc", marginTop: 6, fontSize: 14 }}>No experience added yet.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {experiences.map((e) => (
                  <li key={e.id} className="exp-item" style={{ marginBottom: 10 }}>
                  <div style={{ maxWidth: "74%" }}>
                      <div style={{ fontWeight: 700, color: "#e4e6eb" }}>{e.company || "No Company"} — {e.role || "No Role"}</div>
                      <div style={{ color: "#a5b4fc", fontSize: 13, marginTop: 4 }}>{e.date || "No Date"} • {e.location || "No Location"}</div>
                      <div style={{ color: "#d1d5db", fontSize: 13, marginTop: 8 }}>{e.description}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button className="btn" style={{ background: "transparent", border: "none", color: "#6366f1", padding: 0 }} onClick={() => onEdit(e)}>Edit</button>
                      <button className="btn" style={{ background: "transparent", border: "none", color: "#ef4444", padding: 0 }} onClick={() => onDelete(e.id)}>Remove</button>
                  </div>
                  </li>
              ))}
              </ul>
            )}
            {tempExp && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(26, 31, 58, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <h6 style={{ margin: "0 0 8px 0", color: "#e4e6eb" }}>{editingExpId ? "Edit Entry" : "New Entry"}</h6>
                <input id="exp-company" className="mb-2" placeholder="Company" value={tempExp.company} onChange={(ev)=>setTempExp({...tempExp, company: ev.target.value})} />
                <input className="mb-2" placeholder="Role" value={tempExp.role} onChange={(ev)=>setTempExp({...tempExp, role: ev.target.value})} />
                <input className="mb-2" placeholder="Dates (e.g., Jul 2018 - Dec 2020)" value={tempExp.date} onChange={(ev)=>setTempExp({...tempExp, date: ev.target.value})} />
                <input className="mb-2" placeholder="Location" value={tempExp.location} onChange={(ev)=>setTempExp({...tempExp, location: ev.target.value})} />
                <textarea className="mb-2" rows={3} placeholder="Short description" value={tempExp.description} onChange={(ev)=>setTempExp({...tempExp, description: ev.target.value})} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn primary" onClick={saveExperience}>Save</button>
                  <button className="btn ghost" onClick={() => setTempExp(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Projects Tab --- */}
        {active === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h5 style={{ margin: "0 0 12px 0", fontWeight: 700, color: "#e4e6eb" }}>Projects</h5>
              <div>
                <button onClick={onStartAddProject} className="btn primary">+ Add</button>
              </div>
            </div>
            {projects.length === 0 ? (
              <div style={{ color: "#a5b4fc", marginTop: 6, fontSize: 14 }}>No projects added yet.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {projects.map((p) => (
                  <li key={p.id} className="exp-item" style={{ marginBottom: 10 }}>
                  <div style={{ maxWidth: "74%" }}>
                      <div style={{ fontWeight: 700, color: "#e4e6eb" }}>{p.name}</div>
                      <div style={{ color: "#a5b4fc", fontSize: 13, marginTop: 4 }}>{p.tech} • {p.date}</div>
                      <div style={{ color: "#d1d5db", fontSize: 13, marginTop: 8 }}>{p.description}</div>
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ color: "#6366f1", fontSize: 13, marginTop: 4, display: "inline-block" }}>{p.link}</a>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button className="btn" style={{ background: "transparent", border: "none", color: "#6366f1", padding: 0 }} onClick={() => onEditProject(p)}>Edit</button>
                      <button className="btn" style={{ background: "transparent", border: "none", color: "#ef4444", padding: 0 }} onClick={() => onDeleteProject(p.id)}>Remove</button>
                  </div>
                  </li>
              ))}
              </ul>
            )}
            {tempProject && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(26, 31, 58, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <h6 style={{ margin: "0 0 8px 0", color: "#e4e6eb" }}>{editingProjectId ? "Edit Project" : "New Project"}</h6>
                <input className="mb-2" placeholder="Project Name" value={tempProject.name} onChange={(ev)=>setTempProject({...tempProject, name: ev.target.value})} />
                <input className="mb-2" placeholder="Technologies (e.g., React, Node.js)" value={tempProject.tech} onChange={(ev)=>setTempProject({...tempProject, tech: ev.target.value})} />
                <input className="mb-2" placeholder="Dates (e.g., Jan 2024 - Mar 2024)" value={tempProject.date} onChange={(ev)=>setTempProject({...tempProject, date: ev.target.value})} />
                <input className="mb-2" placeholder="Link (e.g., https://github.com/...)" value={tempProject.link} onChange={(ev)=>setTempProject({...tempProject, link: ev.target.value})} />
                <textarea className="mb-2" rows={3} placeholder="Short description" value={tempProject.description} onChange={(ev)=>setTempProject({...tempProject, description: ev.target.value})} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn primary" onClick={saveProject}>Save</button>
                  <button className="btn ghost" onClick={() => setTempProject(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Education Tab --- */}
        {active === "education" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h5 style={{ margin: "0 0 12px 0", fontWeight: 700, color: "#e4e6eb" }}>Education</h5>
              <div>
                <button onClick={onStartAddEducation} className="btn primary">+ Add</button>
              </div>
            </div>
            {education.length === 0 ? (
                <div style={{ color: "#a5b4fc", marginTop: 6, fontSize: 14 }}>No education info added yet.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {education.map((e) => (
                  <li key={e.id} className="exp-item" style={{ marginBottom: 10 }}>
                  <div style={{ maxWidth: "74%" }}>
                      <div style={{ fontWeight: 700, color: "#e4e6eb" }}>{e.school}</div>
                      <div style={{ color: "#a5b4fc", fontSize: 13, marginTop: 4 }}>{e.degree}</div>
                      <div style={{ color: "#a5b4fc", fontSize: 13, marginTop: 2 }}>{e.date} • {e.location}</div>
                      <div style={{ color: "#d1d5db", fontSize: 13, marginTop: 8 }}>{e.description}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button className="btn" style={{ background: "transparent", border: "none", color: "#6366f1", padding: 0 }} onClick={() => onEditEducation(e)}>Edit</button>
                      <button className="btn" style={{ background: "transparent", border: "none", color: "#ef4444", padding: 0 }} onClick={() => onDeleteEducation(e.id)}>Remove</button>
                  </div>
                  </li>
              ))}
              </ul>
            )}
            {tempEducation && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(26, 31, 58, 0.6)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <h6 style={{ margin: "0 0 8px 0", color: "#e4e6eb" }}>{editingEducationId ? "Edit Entry" : "New Entry"}</h6>
                <input className="mb-2" placeholder="School / University" value={tempEducation.school} onChange={(ev)=>setTempEducation({...tempEducation, school: ev.target.value})} />
                <input className="mb-2" placeholder="Degree (e.g., B.Sc in CSE)" value={tempEducation.degree} onChange={(ev)=>setTempEducation({...tempEducation, degree: ev.target.value})} />
                <input className="mb-2" placeholder="Dates (e.g., 2020 - 2024)" value={tempEducation.date} onChange={(ev)=>setTempEducation({...tempEducation, date: ev.target.value})} />
                <input className="mb-2" placeholder="Location" value={tempEducation.location} onChange={(ev)=>setTempEducation({...tempEducation, location: ev.target.value})} />
                <textarea className="mb-2" rows={3} placeholder="Short description (e.g., CGPA, Thesis)" value={tempEducation.description} onChange={(ev)=>setTempEducation({...tempEducation, description: ev.target.value})} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn primary" onClick={saveEducation}>Save</button>
                  <button className="btn ghost" onClick={() => setTempEducation(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}