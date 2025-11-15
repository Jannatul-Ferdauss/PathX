import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Homepage from './Component/Homepage/Homepage';

import UserDashboard from './Component/UserDashboard/userdash';
import Login from './Component/Login/login.jsx';
import ProfilePage from './Component/Profile/ProfilePage.jsx';
import Course from './Component/Course/courseList.jsx';
import JobList from './Component/Jobs/jobs.jsx';
import Roadmap from './Component/Roadmap/Roadmap';
import CareerBot from './Component/CareerBot/CareerBot';
import AdminDashboard from './Component/AdminDashboard/AdminDashboard';
import AdminMainDashboard from './Component/AdminDashboard/AdminMainDashboard';
import EnhancedAdminDashboard from './Component/AdminDashboard/EnhancedAdminDashboard';
import ManageJobs from './Component/AdminDashboard/ManageJobs';
import ManageResources from './Component/AdminDashboard/ManageResources';
import CVAssistantPage from './Component/CVAssistant/CVAssistantPage.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/userdash" element={<UserDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ProfilePage" element={<ProfilePage />} />
          <Route path="/cv-assistant" element={<CVAssistantPage />} />
          <Route path="/courseList" element={<Course />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/careerbot" element={<CareerBot />} />
          <Route path="/admin" element={<AdminMainDashboard />} />
          <Route path="/admin/dashboard" element={<AdminMainDashboard />} />
          <Route path="/admin/settings" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<EnhancedAdminDashboard />} />
          <Route path="/admin/jobs" element={<ManageJobs />} />
          <Route path="/admin/resources" element={<ManageResources />} />
          <Route path="/admin/users" element={<AdminMainDashboard />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);
 

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
