import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

import SignUpPage from './pages/SignUpPage';
import UploadPage from './pages/UploadPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import MakeupSchedulerPage from './pages/MakeupSchedulerPage';
import LandingPage from './pages/LandingPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                {/* <Route path="/signup" element={<SignUpPage />} /> */}
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/scheduler" element={<MakeupSchedulerPage />} />
            </Routes>
        </Router>
    );
}

export default App;
