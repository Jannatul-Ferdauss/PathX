// src/Component/Homepage/Homepage.jsx
import React, { useEffect, useRef, useState } from "react";
import "./Homepage.css";
import Login from "../Login/login.jsx";
import hero1 from "../../Assets/2.jpg";
import hero2 from "../../Assets/4.jpg";
import hero3 from "../../Assets/5.jpg";
import hero4 from "../../Assets/1.jpg";
import hero5 from "../../Assets/3.jpg";
import frontendImg from "../../Assets/frontend.jpg";
import uiuxImg from "../../Assets/uiux.jpg";
import dataImg from "../../Assets/data.jpg";
import backendImg from "../../Assets/backend.jpg";
import webdevImg from "../../Assets/webdev.jpg";
import datasciImg from "../../Assets/datasci.jpg";
import designImg from "../../Assets/design.jpg";
import digitalImg from "../../Assets/digital.jpg";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Homepage() {
  const slidesRef = useRef([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);

  // ===== Hero Slider =====
  useEffect(() => {
    let currentIndex = 0;
    const slides = slidesRef.current.filter(Boolean);
    if (!slides.length) return;
    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.style.opacity = i === index ? "1" : "0";
        slide.style.transition = "opacity 1s ease-in-out";
      });
    };
    showSlide(currentIndex);
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ===== Firebase Auth Listener =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((err) => console.error(err));
  };

  const jobs = [
    { title: "Frontend Developer", company: "Tech Solutions Inc.", image: frontendImg },
    { title: "UI/UX Designer", company: "Creative Studio", image: uiuxImg },
    { title: "Data Analyst", company: "Analytics Pro", image: dataImg },
    { title: "Backend Engineer", company: "Cloud Systems", image: backendImg },
  ];

  const courses = [
    { title: "Web Development Bootcamp", desc: "Master HTML, CSS, JS & React", image: webdevImg },
    { title: "Data Science Fundamentals", desc: "Learn Python, stats & ML basics", image: datasciImg },
    { title: "UI/UX Design Mastery", desc: "Create beautiful user experiences", image: designImg },
    { title: "Digital Marketing Pro", desc: "Master SEO, social media & content", image: digitalImg },
  ];

  return (
    <>
      {/* Header with PathX Branding */}
      <header className="homepage-header">
        <div className="header-left">
          <svg className="pathx-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18.5c-3.82-.93-6.5-4.65-6.5-8.5V8.3l6.5-3.11v15.31z"/>
          </svg>
          <span className="pathx-name">PathX</span>
        </div>
        {user ? (
          <button className="btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="btn login-btn" onClick={() => setAuthOpen(true)}>
            Login
          </button>
        )}
      </header>

      {/* Hero Section */}
      <section className="welcome-banner">
        <div className="slides-container">
          {[hero1, hero2, hero3, hero4, hero5].map((img, i) => (
            <div
              key={i}
              ref={(el) => (slidesRef.current[i] = el)}
              className="slide"
              style={{ backgroundImage: `url(${img})` }}
            ></div>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="section">
        <h2 className="section-heading">Featured Jobs</h2>
        <div className="grid">
          {jobs.map((job, i) => (
            <div className="job-card" key={i}>
              <img src={job.image} alt={job.title} className="card-img" />
              <div className="card-content">
                <h3 className="job-title">{job.title}</h3>
                <p className="job-company">{job.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Courses */}
      <section className="section">
        <h2 className="section-heading">Popular Courses</h2>
        <div className="grid">
          {courses.map((course, i) => (
            <div className="course-card" key={i}>
              <img src={course.image} alt={course.title} className="card-img" />
              <div className="card-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Login Modal */}
      {authOpen && <Login isOpen={authOpen} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
