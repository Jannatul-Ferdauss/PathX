import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaFilter } from "react-icons/fa";
// 🛑 Changed from 'getDocs' to 'onSnapshot' for real-time updates
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase"; 
import "./courseList.css";

// Platform image mapping
const platformImages = {
  // Assuming images are in the public directory or imported correctly
  YouTube: "/images/youtube.png",
  Udemy: "/images/udemy.png",
  Coursera: "/images/courseera.png",
  Local: "/images/local.png",
};

// CourseCard component (No changes needed here)
function CourseCard({ course }) {
  // Helper function to clean URLs - removes quotes and ensures proper protocol
  const cleanUrl = (url) => {
    if (!url) return null;
    // Remove surrounding quotes
    let cleaned = url.trim().replace(/^\"+|\"+$/g, '');
    // If URL doesn't start with http:// or https://, add https://
    if (cleaned && !cleaned.match(/^https?:\/\//i)) {
      cleaned = 'https://' + cleaned;
    }
    return cleaned;
  };

  return (
    <div className="courseCard">
      <div className="courseImage">
        <img
          src={course.logo || platformImages[course.platform] || "/images/default-course.png"}
          alt={course.platform}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "8px",
            objectFit: "cover",
          }}
        />
      </div>
      <div className="courseInfo">
        <h2 className="courseTitle">{course.title}</h2>
        <p className="platform">Platform: {course.platform}</p>
        <p className="url">
          Link:{" "}
          <a href={cleanUrl(course.url)} target="_blank" rel="noopener noreferrer">
            {course.url}
          </a>
        </p>
        <p className="skills">
          Skills: {course.relatedSkills?.join(", ") || "Not specified"}
        </p>
        <p className="cost">
          Cost:
          <span
            className={`badge ${
              course.costIndicator?.toLowerCase() || "unknown"
            }`}
            style={{
              marginLeft: "8px",
              padding: "2px 8px",
              borderRadius: "12px",
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            {course.costIndicator || "N/A"}
          </span>
        </p>
      </div>
    </div>
  );
}

// Allcourses component
function Allcourses() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState("resources");

  // State to hold ALL courses fetched from Firebase (will update live)
  const [allCourses, setAllCourses] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Filter/Sort States
  const [sortOption, setSortOption] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [costFilter, setCostFilter] = useState("");

  // 1. Fetch courses from Firestore using onSnapshot for real-time updates
  useEffect(() => {
    // 1. Get a reference to the 'courses' collection
    const coursesCollectionRef = collection(db, "courses");

    // 2. Set up the real-time listener (onSnapshot)
    const unsubscribe = onSnapshot(coursesCollectionRef, (querySnapshot) => {
      try {
        const coursesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Update the main course list state
        setAllCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    }, (error) => {
        // Optional: Handle listener errors
        console.error("Firebase listener error:", error);
        setLoading(false);
    });

    // 3. IMPORTANT: Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Runs only once on mount

  // 2. Memoize the Filtering and Sorting Logic
  // This calculates the filtered/sorted list ONLY when allCourses or filter states change.
  const filteredAndSortedCourses = useMemo(() => {
    let updatedCourses = [...allCourses];

    // Filter by Skills
    if (selectedSkills.length > 0) {
      updatedCourses = updatedCourses.filter((course) =>
        course.relatedSkills?.some((skill) => selectedSkills.includes(skill))
      );
    }

    // Filter by Cost
    if (costFilter) {
      updatedCourses = updatedCourses.filter(
        (course) => course.costIndicator === costFilter
      );
    }

    // Sort
    if (sortOption === "title") {
      updatedCourses.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === "title-desc") {
      updatedCourses.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOption === "platform") {
      updatedCourses.sort((a, b) => a.platform.localeCompare(b.platform));
    }

    return updatedCourses;
  }, [selectedSkills, costFilter, sortOption, allCourses]); // Dependencies

  // Collect all unique skills for the filter sidebar (memoized for efficiency)
  const allSkills = useMemo(() => {
    return [
      ...new Set(allCourses.flatMap((course) => course.relatedSkills || [])),
    ].sort(); // Optional: Sort skills alphabetically
  }, [allCourses]);


  // Handler functions (no changes)
  const handleSortChange = (event) => setSortOption(event.target.value);
  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  const handleCostFilterChange = (event) => setCostFilter(event.target.value);

  return (
    <div
      style={{
        display: "flex",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100%",
          width: sidebarOpen ? 256 : 80,
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          zIndex: 40,
          overflowY: "auto",
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
              style={{ width: 40, height: 40 }}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"
                stroke="#2563eb"
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
                    color: "#1f2937",
                    fontSize: "1.15rem",
                  }}
                >
                  PathX
                </span>
              </div>
            )}
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "dashboard", label: "Dashboard", icon: "📊", path: "/userdash" },
              { id: "jobs", label: "Jobs", icon: "💼", path: "/jobs" },
              { id: "resources", label: "Resources", icon: "📚", path: "/courses" },
              { id: "profile", label: "Profile", icon: "👤", path: "/profile/1" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  navigate(item.path);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    currentView === item.id
                      ? "rgba(59, 130, 246, 0.1)"
                      : "transparent",
                  color: currentView === item.id ? "#3b82f6" : "#6b7280",
                  cursor: "pointer",
                  transition: "all 0.2s",
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
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ marginLeft: sidebarOpen ? 256 : 80, flex: 1 }}>
        <div className="app">
          <header className="header">
            <h1 className="headerTitle">All Courses</h1>
          </header>
          <div className="content">
            {/* Filter Sidebar */}
            <aside className="sidebar">
              <h2 className="filterBox">
                <FaFilter className="filterIcon" /> Filter Options
              </h2>

              <select
                className="sortDropdown"
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="">Sort by</option>
                <option value="title">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="platform">Platform (A-Z)</option>
              </select>

              <div className="filterSection">
                <h3 className="filterHeading">Filter by Skills</h3>
                <div className="filterOptions">
                  {allSkills.map((skill) => (
                    <label key={skill} className="filterOption">
                      <input
                        type="checkbox"
                        value={skill}
                        checked={selectedSkills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                      />
                      {skill}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filterSection">
                <h3 className="filterHeading">Filter by Cost</h3>
                <div className="filterOptions">
                  {["Free", "Paid"].map((cost) => (
                    <label key={cost} className="filterOption">
                      <input
                        type="radio"
                        name="cost"
                        value={cost}
                        onChange={handleCostFilterChange}
                        checked={costFilter === cost}
                      />
                      {cost}
                    </label>
                  ))}
                  <label className="filterOption">
                    <input
                      type="radio"
                      name="cost"
                      value=""
                      onChange={handleCostFilterChange}
                      checked={costFilter === ""}
                    />
                    All
                  </label>
                </div>
              </div>
            </aside>

            {/* Course List */}
            <div className="courseList">
              {loading ? (
                <p style={{ textAlign: "center", marginTop: "40px" }}>
                  Loading courses...
                </p>
              ) : filteredAndSortedCourses.length > 0 ? (
                filteredAndSortedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              ) : (
                <p style={{ textAlign: "center", marginTop: "40px" }}>
                  No courses found matching your filters.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Allcourses;