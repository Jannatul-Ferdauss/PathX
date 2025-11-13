import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./jobs.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function Jobs() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch jobs from Firestore
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "jobs"));
        const jobsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setJobs(jobsList);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs =
    filter === "All" ? jobs : jobs.filter((job) => job.type === filter);

  if (loading) return <p style={{ padding: "2rem" }}>Loading jobs...</p>;

  return (
    <div
      style={{
        display: "flex",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        background: "#0a0e27",
      }}
    >
      {/* Sidebar - Dark Theme */}
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
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.3rem",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  PathX
                </span>
              </div>
            )}
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "dashboard", label: "Dashboard", icon: "📊", route: "/userdash" },
              { id: "jobs", label: "Jobs", icon: "💼", route: "/jobs" },
              { id: "resources", label: "Resources", icon: "📚", route: "/courseList" },
              { id: "profile", label: "Profile", icon: "👤", route: "/ProfilePage" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    window.location.pathname === item.route
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)"
                      : "transparent",
                  color:
                    window.location.pathname === item.route
                      ? "#a5b4fc"
                      : "#e4e6eb",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: window.location.pathname === item.route ? "0 4px 15px rgba(99, 102, 241, 0.2)" : "none",
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
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
              background: "rgba(99, 102, 241, 0.1)",
              color: "#a5b4fc",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ marginLeft: sidebarOpen ? 256 : 80, flex: 1 }}>
        <div className="jobs-page">
          <h1>Opportunities for Students</h1>

          {/* Filter Buttons */}
          <div className="filter-bar">
            {["All", "Internship", "Part-time", "Full-time", "Freelance"].map((f) => (
              <button
                key={f}
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Job Grid */}
          <div className="jobs-grid">
            {filteredJobs.length === 0 ? (
              <p>No jobs available.</p>
            ) : (
              filteredJobs.map((job) => (
                <div
                  className="job-card"
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="job-summary">
                    {job.logo && (
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="company-logo"
                      />
                    )}
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Job Modal */}
          {selectedJob && (
            <div
              className="modal-backdrop"
              onClick={() => setSelectedJob(null)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h2>{selectedJob.title}</h2>
                <p>
                  <strong>Company:</strong> {selectedJob.company}
                </p>
                <p>
                  <strong>Location:</strong> {selectedJob.location}
                </p>
                {selectedJob.skills && (
                  <p>
                    <strong>Skills:</strong> {selectedJob.skills.join(", ")}
                  </p>
                )}
                <p>
                  <strong>Experience:</strong> {selectedJob.level}
                </p>
                <button
                  className={`job-type-btn ${selectedJob.type?.toLowerCase()}`}
                >
                  {selectedJob.type}
                </button>
                <p>{selectedJob.description}</p>
                <button
                  className="close-btn"
                  onClick={() => setSelectedJob(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
