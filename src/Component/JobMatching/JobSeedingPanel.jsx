// Admin Panel for Seeding Jobs - Temporary Component
// Import this in your App.js temporarily to seed jobs

import React, { useState } from "react";
import { seedJobs, clearJobs } from "./seedJobs";

export default function JobSeedingPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSeedJobs = async (clearFirst) => {
    setLoading(true);
    setMessage("Seeding jobs...");
    
    try {
      const result = await seedJobs(clearFirst);
      if (result.success) {
        setMessage(`✅ Successfully seeded ${result.count} jobs!`);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearJobs = async () => {
    if (!window.confirm("Are you sure you want to delete ALL jobs from Firestore?")) {
      return;
    }
    
    setLoading(true);
    setMessage("Clearing jobs...");
    
    try {
      await clearJobs();
      setMessage("✅ All jobs cleared!");
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "20px",
      background: "linear-gradient(135deg, #1a1f3a, #0f1420)",
      border: "2px solid rgba(99, 102, 241, 0.3)",
      borderRadius: "12px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      zIndex: 9999,
      minWidth: "300px"
    }}>
      <h3 style={{ 
        margin: "0 0 16px 0", 
        color: "#e4e6eb",
        fontSize: "1.2rem",
        borderBottom: "2px solid rgba(99, 102, 241, 0.3)",
        paddingBottom: "8px"
      }}>
        🛠️ Admin: Job Seeding
      </h3>
      
      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={() => handleSeedJobs(false)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "8px",
            transition: "all 0.3s ease"
          }}
        >
          {loading ? "Processing..." : "Seed Sample Jobs"}
        </button>
        
        <button
          onClick={() => handleSeedJobs(true)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "8px",
            transition: "all 0.3s ease"
          }}
        >
          {loading ? "Processing..." : "Clear & Reseed Jobs"}
        </button>
        
        <button
          onClick={handleClearJobs}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          {loading ? "Processing..." : "⚠️ Clear All Jobs"}
        </button>
      </div>
      
      {message && (
        <div style={{
          padding: "12px",
          background: message.includes("✅") 
            ? "rgba(16, 185, 129, 0.1)" 
            : "rgba(239, 68, 68, 0.1)",
          border: `1px solid ${message.includes("✅") ? "#10b981" : "#ef4444"}`,
          borderRadius: "8px",
          color: message.includes("✅") ? "#10b981" : "#ef4444",
          fontSize: "0.9rem",
          marginTop: "12px"
        }}>
          {message}
        </div>
      )}
      
      <div style={{
        marginTop: "16px",
        padding: "12px",
        background: "rgba(99, 102, 241, 0.1)",
        borderRadius: "8px",
        fontSize: "0.8rem",
        color: "#a5b4fc",
        lineHeight: "1.5"
      }}>
        <strong>Note:</strong> This panel seeds 12 sample jobs with various:
        <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
          <li>Job types (Full-time, Part-time, Internship, Freelance)</li>
          <li>Experience levels (Entry, Mid, Senior)</li>
          <li>Skill requirements</li>
          <li>Locations (Dhaka, Remote, etc.)</li>
        </ul>
      </div>
      
      <div style={{
        marginTop: "12px",
        fontSize: "0.75rem",
        color: "#6b7280",
        textAlign: "center"
      }}>
        Remove this component after seeding
      </div>
    </div>
  );
}
