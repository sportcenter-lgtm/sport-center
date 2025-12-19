import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowRight, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import config from '../config';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Sending reset link...' });

        try {
            await axios.post(`${config.API_URL}/forgot-password`, { email });
            setStatus({ type: 'success', message: 'Reset link sent! Check your email (and server console).' });
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.detail || 'Failed to send reset link' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-gradient-to-br from-primary to-secondary rounded-xl mb-4">
                        <Activity className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        Reset <span className="gradient-text">Password</span>
                    </h1>
                    <p className="text-gray-400">Enter your email to receive a recovery link</p>
                </div>

                <div className="glass-panel p-8">
                    {status.message && (
                        <div className={`mb-4 p-3 border rounded text-sm text-center ${status.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' :
                            status.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-200' :
                                'bg-blue-500/20 border-blue-500/50 text-blue-200'
                            }`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status.type === 'loading'}
                            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Send Reset Link <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Remember your password?{' '}
                        <Link to="/" className="text-primary hover:text-white transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
