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
    React.useEffect(() => {
        // Single-user mode: Auto-login as admin
        if (!localStorage.getItem('username')) {
            localStorage.setItem('username', 'llorhan');
            localStorage.setItem('role', 'admin');
        }
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<MakeupSchedulerPage />} />
                <Route path="/scheduler" element={<MakeupSchedulerPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
        </Router>
    );
}

export default App;
