import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { Activity, TrendingUp, Video, Trophy, Calendar } from 'lucide-react';

const LoginBackground = () => {
    // Dummy data for the showcase
    const radarData = [
        { subject: 'Serve', A: 9.2, fullMark: 10 },
        { subject: 'Smash', A: 8.5, fullMark: 10 },
        { subject: 'Forehand', A: 7.8, fullMark: 10 },
        { subject: 'Backhand', A: 6.5, fullMark: 10 },
        { subject: 'Volley', A: 8.9, fullMark: 10 },
        { subject: 'Defense', A: 7.2, fullMark: 10 },
    ];

    return (
        <div className="absolute inset-0 overflow-hidden bg-[#0f172a] -z-10">
            {/* Abstract Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            {/* Mock Dashboard Grid - Tilted/Perspective View */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40 scale-110" style={{ transform: 'perspective(1000px) rotateX(5deg) rotateY(5deg) scale(0.9)' }}>
                <div className="grid grid-cols-12 gap-6 w-full max-w-7xl p-8">

                    {/* Main Stats Card */}
                    <div className="col-span-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Activity className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Performance Analysis</h3>
                                    <p className="text-sm text-gray-400">Weekly Progress</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">+12.5%</span>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#4b5563" strokeOpacity={0.5} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Score"
                                        dataKey="A"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fill="#8b5cf6"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Side Stats */}
                    <div className="col-span-4 space-y-6">
                        {/* Recent Match */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                <h3 className="font-bold text-white">Recent Achievement</h3>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">Top 5%</div>
                            <p className="text-sm text-gray-400">Serve Consistency</p>
                            <div className="mt-4 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-yellow-400 h-full w-[95%]"></div>
                            </div>
                        </div>

                        {/* Video Analysis Preview */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-4">
                                <Video className="w-5 h-5 text-blue-400" />
                                <h3 className="font-bold text-white">Latest Upload</h3>
                            </div>
                            <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center border border-white/5">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-sm text-gray-300">Serve_Practice_01.mp4</span>
                                <span className="text-xs text-gray-500">2 mins ago</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="col-span-12 grid grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-400">Session {i}</span>
                                </div>
                                <div className="text-lg font-bold text-white">Analysis Complete</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overlay Gradient to fade it out slightly */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/80 via-[#0f172a]/60 to-[#0f172a]/90"></div>
        </div>
    );
};

export default LoginBackground;
