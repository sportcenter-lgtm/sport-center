import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import config from '../config';

const SignUpPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: '',
        sport: 'beach tennis'
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const { username, password, email, name, sport } = formData;
            await axios.post(`${config.API_URL}/register`, {
                username,
                password,
                email,
                name,
                sport
            });
            // Switch to verification mode
            setIsVerifying(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await axios.post(`${config.API_URL}/verify-email`, {
                username: formData.username,
                code: verificationCode
            });
            alert("Account verified successfully! Please log in.");
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Verification failed');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-gradient-to-br from-primary to-secondary rounded-xl mb-4">
                        <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        {isVerifying ? "Verify Email" : "Create Account"}
                    </h1>
                    <p className="text-gray-400">
                        {isVerifying ? "Enter the 6-digit code sent to your email" : "Join the community and improve your game"}
                    </p>
                </div>

                <div className="glass-panel p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {!isVerifying ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Primary Sport</label>
                                <select
                                    value={formData.sport}
                                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="beach tennis">Beach Tennis</option>
                                    <option value="tennis">Tennis</option>
                                    <option value="pickleball">Pickleball</option>
                                    <option value="padel">Padel</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-6"
                            >
                                Create Account <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-primary transition-colors"
                                    placeholder="000000"
                                    maxLength="6"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    (Check the backend console for the code in this demo)
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                            >
                                Verify & Login <CheckCircle className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link to="/" className="text-primary hover:text-white transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUpPage;
