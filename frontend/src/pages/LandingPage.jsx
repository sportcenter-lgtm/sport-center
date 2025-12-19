import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Calendar } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-bold mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent text-center">
                Select Your Tool
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Tool 1: Sport Analysis */}
                <button
                    onClick={() => navigate('/profile')}
                    className="group bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-3xl p-10 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:shadow-blue-900/20"
                >
                    <div className="bg-blue-900/30 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
                        <Activity size={48} className="text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Sport Analysis</h2>
                    <p className="text-gray-400">
                        Upload videos, analyze technique, and track player progress over time.
                    </p>
                </button>

                {/* Tool 2: Reschedule Tool */}
                <button
                    onClick={() => navigate('/scheduler')}
                    className="group bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-3xl p-10 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:shadow-purple-900/20"
                >
                    <div className="bg-purple-900/30 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
                        <Calendar size={48} className="text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Reschedule Tool</h2>
                    <p className="text-gray-400">
                        Manage classes, track attendance, and handle makeup sessions easily.
                    </p>
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
