import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import StatsDashboard from '../components/StatsDashboard';
import OnboardingTour from '../components/OnboardingTour';
import { Activity, LogOut, User, Plus, Settings, Trash2, X, Save, Home } from 'lucide-react';
import config from '../config';

const ProfilePage = () => {
    const [history, setHistory] = useState([]);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const loggedInUser = localStorage.getItem('username') || 'llorhan';
    const loggedInRole = localStorage.getItem('role') || 'admin';

    // Auto-login if needed
    useEffect(() => {
        if (!localStorage.getItem('username')) {
            localStorage.setItem('username', 'llorhan');
            localStorage.setItem('role', 'admin');
        }
    }, []);

    // If admin and ?username=... is present, view that user. Otherwise view self.
    const targetUser = (loggedInRole === 'admin' && searchParams.get('username'))
        ? searchParams.get('username')
        : loggedInUser;

    const isOwnProfile = targetUser === loggedInUser;
    const canEdit = isOwnProfile || loggedInRole === 'admin';

    useEffect(() => {
        fetchHistory();
    }, [targetUser]);

    const [students, setStudents] = useState([]);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentSport, setNewStudentSport] = useState('beach tennis');

    // Notes state
    const [improvementNotes, setImprovementNotes] = useState('');

    // Check if we are viewing a specific student
    const studentId = searchParams.get('studentId');

    const fetchHistory = async () => {
        try {
            const historyKey = studentId ? `${targetUser}:${studentId}` : targetUser;
            const response = await axios.get(`${config.API_URL}/history/${historyKey}`);
            setHistory(response.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
            setHistory([]);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/students/${targetUser}`);
            setStudents(response.data);

            // If viewing a student, find them and set notes
            if (studentId) {
                const s = response.data.find(std => std.id === studentId);
                if (s) {
                    setImprovementNotes(s.weaknesses || '');
                }
            }
        } catch (err) {
            console.error("Failed to fetch students", err);
        }
    };

    useEffect(() => {
        // Re-fetch when user or student ID changes
        if (targetUser) {
            fetchStudents();
        }
    }, [targetUser, studentId]);

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${config.API_URL}/students/${targetUser}`, {
                name: newStudentName,
                // email: optional
                sport: newStudentSport
            });
            setShowAddStudent(false);
            setNewStudentName('');
            setNewStudentSport('beach tennis');
            fetchStudents();
        } catch (err) {
            console.error(err);
            alert(`Failed to add student: ${err.response?.data?.detail || err.message}`);
        }
    };

    const handleDeleteStudent = async (id) => {
        if (window.confirm("Delete this student profile?")) {
            try {
                await axios.delete(`${config.API_URL}/students/${targetUser}/${id}`);
                fetchStudents();
            } catch (err) {
                alert("Failed to delete student");
            }
        }
    };

    // Failed fetchUserDetails removed

    const handleLogout = () => {
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
            try {
                await axios.delete(`${config.API_URL}/users/${targetUser}`);
                if (isOwnProfile) {
                    handleLogout();
                } else {
                    navigate('/admin');
                }
            } catch (err) {
                alert("Failed to delete account");
            }
        }
    };

    // handleUpdateProfile removed

    return (
        <div className="min-h-screen p-8 relative">
            <header className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-white/5 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all mr-2"
                        title="Back to Landing Page"
                    >
                        <Home className="w-6 h-6" />
                    </button>
                    <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Sports <span className="gradient-text">Analysis</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Header elements removed */}
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isOwnProfile ? "Your Progress" : `${targetUser}'s Progress`}
                        </h2>
                        <p className="text-gray-400">Track technique evolution over time.</p>
                    </div>

                    {isOwnProfile && (
                        <button
                            id="upload-btn"
                            onClick={() => navigate('/upload')}
                            className="bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Analyze New Video
                        </button>
                    )}
                </div>

                <div id="stats-dashboard">
                    <StatsDashboard history={history} />
                </div>

                {/* Coach Notes (Improvement Areas) - Only visible when viewing a student */}
                {studentId && (
                    <div className="mt-8 glass-panel p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" /> Areas for Improvement
                            </h3>
                            {canEdit && (
                                <button
                                    onClick={async () => {
                                        // Save notes
                                        try {
                                            await axios.put(`${config.API_URL}/students/${targetUser}/${studentId}`, {
                                                weaknesses: improvementNotes
                                            });
                                            alert("Notes saved successfully");
                                        } catch (err) {
                                            alert("Failed to save notes");
                                        }
                                    }}
                                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-1 rounded text-sm transition-colors"
                                >
                                    Save Notes
                                </button>
                            )}
                        </div>
                        {canEdit ? (
                            <textarea
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-primary resize-none"
                                placeholder="Add notes about weak shots or areas to improve..."
                                value={improvementNotes}
                                onChange={(e) => setImprovementNotes(e.target.value)}
                            />
                        ) : (
                            <div className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-gray-300 min-h-[5rem] whitespace-pre-wrap">
                                {improvementNotes || "No notes added yet."}
                            </div>
                        )}
                    </div>
                )}

                {/* Students Section */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">My Students</h2>
                        {isOwnProfile && (
                            <button
                                onClick={() => setShowAddStudent(true)}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Student
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map(student => (
                            <div key={student.id} className="glass-panel p-6 relative group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{student.name}</h3>
                                        <p className="text-sm text-gray-400 capitalize">{student.sport}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => navigate(`/profile?username=${targetUser}&studentId=${student.id}`)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded text-sm transition-colors"
                                    >
                                        View Progress
                                    </button>
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => handleDeleteStudent(student.id)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {students.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No students added yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Add Student Modal */}
            {showAddStudent && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-8 max-w-md w-full relative">
                        <button
                            onClick={() => setShowAddStudent(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6">Add New Student</h2>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Student Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
                                <select
                                    value={newStudentSport}
                                    onChange={(e) => setNewStudentSport(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="beach tennis">Beach Tennis</option>
                                    <option value="tennis">Tennis</option>
                                    <option value="padel">Padel</option>
                                    <option value="pickleball">Pickleball</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Create Profile
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}

        </div>
    );
};

export default ProfilePage;
