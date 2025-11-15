import React, { useEffect, useRef, useState } from "react";
import "./login.css";
import { auth, db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { isAdmin, FIXED_ADMIN } from "../../services/adminAuthService";


export default function AuthModal({ isOpen, onClose }) {
  const overlayRef = useRef(null);
  const [tab, setTab] = useState("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Signup state
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "student",
    institute: "",
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess("");
      setTab("login");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => (document.body.style.overflow = "");
  }, [isOpen]);

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [tab]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const close = () => {
    setError("");
    setSuccess("");
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) close();
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

  // ✅ LOGIN HANDLER (Connects with Firebase Auth)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { email, password } = loginData;
    if (!email || !password) {
      setError("Please fill both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Optional: Load user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        console.log("User data:", userDoc.data());
      }

      // ✅ Check if user is admin
      const adminStatus = await isAdmin(user.uid);
      
      if (adminStatus || email === FIXED_ADMIN.email) {
        setSuccess("Welcome Admin! Redirecting to admin panel...");
        setTimeout(() => {
          close();
          navigate("/admin/dashboard"); // 🔐 Navigate to admin dashboard
        }, 900);
      } else {
        setSuccess("Logged in successfully!");
        setTimeout(() => {
          close();
          navigate("/userdash"); // 🧭 Navigate to user dashboard
        }, 900);
      }

  } catch (err) {
    console.error(err);
    setError(err.message.replace("Firebase:", "").trim());
  }
};

  // ✅ SIGNUP HANDLER (Creates user + stores extra info in Firestore)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { name, email, password, confirm, role, institute } = signupData;

    if (!name || !email || !password || !confirm) {
      setError("Please fill all required fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // ✅ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Update display name
      await updateProfile(user, { displayName: name });

      // ✅ Store extra info in Firestore
      const userData = {
        name,
        email,
        role,
        institute,
        skills,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), userData);

      setSuccess("Account created successfully!");
      console.log("User saved:", userData);

      setTimeout(close, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase:", "").trim());
    }
  };

  // ✅ Skills handlers
  const addSkill = (value) => {
    const v = value.trim();
    if (v && !skills.includes(v)) setSkills((s) => [...s, v]);
    setSkillInput("");
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === "Backspace" && skillInput === "" && skills.length) {
      setSkills((s) => s.slice(0, -1));
    }
  };

  const removeSkill = (skill) => {
    setSkills((s) => s.filter((x) => x !== skill));
  };

  // ✅ JSX UI
  return (
    <div
      className="auth-overlay"
      ref={overlayRef}
      onMouseDown={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="auth-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={close}>
          ×
        </button>

        <div className="auth-header">
          <h1>{tab === "login" ? "LOGIN" : "SIGN UP"}</h1>
          {tab === "login" ? (
            <p>
              New here?{" "}
              <button className="link-like" onClick={() => setTab("signup")}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button className="link-like" onClick={() => setTab("login")}>
                Login
              </button>
            </p>
          )}
        </div>

        <div className="auth-body">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {tab === "login" && (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </label>
              <button type="submit" className="auth-submit">
                Login
              </button>
            </form>
          )}

          {tab === "signup" && (
            <form className="auth-form" onSubmit={handleSignupSubmit}>
              <label>
                Full name
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                />
              </label>
              <div className="two-col">
                <label>
                  Password
                  <input
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Confirm password
                  <input
                    type="password"
                    value={signupData.confirm}
                    onChange={(e) => setSignupData({ ...signupData, confirm: e.target.value })}
                    required
                  />
                </label>
              </div>
              <div className="two-col">
                <label>
                  Role
                  <select
                    value={signupData.role}
                    onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="fresh-graduate">Fresh Graduate</option>
                    <option value="job-seeker">Job Seeker</option>
                  </select>
                </label>
                <label>
                  Institute
                  <input
                    type="text"
                    value={signupData.institute}
                    onChange={(e) =>
                      setSignupData({ ...signupData, institute: e.target.value })
                    }
                    placeholder="e.g., University of Dhaka"
                  />
                </label>
              </div>

              {/* Skills input */}
              <label>
                Skills
                <div className="skills-input-wrap">
                  <div className="skills-chips">
                    {skills.map((s) => (
                      <div className="skill-chip" key={s}>
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          className="remove-skill"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="skills-entry">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Type a skill and press Enter"
                    />
                    <button type="button" onClick={() => addSkill(skillInput)}>
                      +
                    </button>
                  </div>
                </div>
              </label>

              <button type="submit" className="auth-submit">
                Create account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
