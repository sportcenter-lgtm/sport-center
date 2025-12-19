import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import LoginBackground from '../components/LoginBackground';
import config from '../config';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${config.API_URL}/login`, {
                username,
                password
            });

            localStorage.setItem('username', response.data.user.username);
            localStorage.setItem('role', response.data.user.role);

            if (response.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/profile');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Rich Background */}
            <LoginBackground />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-gradient-to-br from-primary to-secondary rounded-xl mb-4 shadow-lg shadow-primary/20">
                        <Activity className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-white drop-shadow-lg">
                        Sports <span className="gradient-text">Analysis</span>
                    </h1>
                    <p className="text-gray-300 drop-shadow-md">Sign in to access your performance dashboard</p>
                </div>

                <div className="glass-panel p-8 backdrop-blur-md bg-black/40 border-white/10 shadow-2xl">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-500"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            Sign In <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col gap-2 text-center text-sm text-gray-400">
                        <Link to="/forgot-password" className="hover:text-white transition-colors">
                            Forgot Password?
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
