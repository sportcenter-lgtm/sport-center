import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UploadZone from '../components/UploadZone';
import AnalysisResults from '../components/AnalysisResults';
import { Activity, ArrowLeft, LogOut, User } from 'lucide-react';
import config from '../config';

const UploadPage = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [shotType, setShotType] = useState('serve');
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');

    const username = localStorage.getItem('username') || 'demo_user';

    React.useEffect(() => {
        // Fetch students
        const fetchStudents = async () => {
            try {
                const response = await axios.get(`${config.API_URL}/students/${username}`);
                setStudents(response.data);
            } catch (e) { }
        };
        if (username) fetchStudents();
    }, [username]);

    const handleUpload = async (file, trimStart = 0, trimEnd = null) => {
        setIsUploading(true);
        setError(null);
        setResults(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('shot_type', shotType);
        if (trimStart) formData.append('trim_start', trimStart);
        if (trimEnd) formData.append('trim_end', trimEnd);

        // If a student is selected, append their ID to the username so history saves correctly
        // Convention: "username:student_id"
        const finalUsername = selectedStudentId ? `${username}:${selectedStudentId}` : username;
        formData.append('username', finalUsername);

        try {
            const response = await axios.post(`${config.API_URL}/analyze`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
            });
            setResults(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to analyze video. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('username');
        navigate('/');
    };

    return (
        <div className="min-h-screen p-8">
            <header className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Sports <span className="gradient-text">Analysis</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-300 bg-white/5 px-4 py-2 rounded-full">
                        <User className="w-4 h-4" />
                        <span className="capitalize">{username}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/profile')}
                    className="mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Profile
                </button>

                {!results && (
                    <div className="mb-12 text-center space-y-4">
                        <h2 className="text-4xl font-bold mb-6">
                            New <span className="gradient-text">Analysis</span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Upload your gameplay video to analyze your form,
                            stability, and shot mechanics.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center">
                        {error}
                    </div>
                )}

                {!results ? (
                    <UploadZone
                        onUpload={handleUpload}
                        isUploading={isUploading}
                        shotType={shotType}
                        setShotType={setShotType}
                    />
                ) : (
                    <div className="space-y-8">
                        <button
                            onClick={() => setResults(null)}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            ← Analyze another video
                        </button>
                        <AnalysisResults results={results} />
                    </div>
                )}
            </main>
        </div>
    );
};

export default UploadPage;
