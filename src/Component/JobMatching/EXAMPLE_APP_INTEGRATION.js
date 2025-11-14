// Example: How to temporarily add JobSeedingPanel to your app
// Copy this code to your App.js or create a new route

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JobSeedingPanel from './Component/JobMatching/JobSeedingPanel';

// Your existing imports
import Homepage from './Component/Homepage/Homepage';
import Login from './Component/Login/login';
import Jobs from './Component/Jobs/jobs';
import ProfilePage from './Component/Profile/ProfilePage';
// ... other imports

function App() {
  return (
    <Router>
      {/* 
        TEMPORARY: Add this panel to seed jobs 
        Remove after seeding is complete!
      */}
      <JobSeedingPanel />
      
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/ProfilePage" element={<ProfilePage />} />
        {/* ... other routes */}
      </Routes>
    </Router>
  );
}

export default App;

/* 
STEPS TO USE:
1. Add import: import JobSeedingPanel from './Component/JobMatching/JobSeedingPanel';
2. Add <JobSeedingPanel /> inside your main component
3. Start the app: npm start
4. Click "Seed Sample Jobs" button in top-right
5. Remove <JobSeedingPanel /> after seeding
6. Done! Navigate to Jobs page to see matches
*/
