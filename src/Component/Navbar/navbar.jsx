import React from "react";
import "./navbar.css"; // your navbar CSS

function Navbar({ setAuthOpen }) {
  return (
    <nav className="navbar">
      <div className="logo-container">
        <svg
          className="logo-icon"
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
        <h1 className="site-title">PathX</h1>
      </div>

      <button className="login-btn" onClick={() => setAuthOpen(true)}>
        Login
      </button>
    </nav>
  );
}

export default Navbar;
