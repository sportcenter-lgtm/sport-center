import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    Tooltip
} from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';

const StatsDashboard = ({ history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="text-center text-gray-400 py-8">
                No analysis history yet. Upload a video to see your stats!
            </div>
        );
    }

    // Process data for Radar Chart (Average score per shot type)
    const shotStats = history.reduce((acc, curr) => {
        if (!acc[curr.shot_type]) {
            acc[curr.shot_type] = { total: 0, count: 0 };
        }
        acc[curr.shot_type].total += curr.score;
        acc[curr.shot_type].count += 1;
        return acc;
    }, {});

    const radarData = Object.keys(shotStats).map(shot => ({
        subject: shot.charAt(0).toUpperCase() + shot.slice(1),
        A: (shotStats[shot].total / shotStats[shot].count).toFixed(1),
        fullMark: 10,
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Spider Diagram */}
            <div className="glass-panel p-6">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-white">Skill Analysis</h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#4b5563" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar
                                name="Score"
                                dataKey="A"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="#8b5cf6"
                                fillOpacity={0.3}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                itemStyle={{ color: '#8b5cf6' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* History Table */}
            <div className="glass-panel p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-secondary" />
                    <h3 className="text-xl font-bold text-white">Recent Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="pb-3 text-gray-400 font-medium">Date</th>
                                <th className="pb-3 text-gray-400 font-medium">Shot</th>
                                <th className="pb-3 text-gray-400 font-medium">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {[...history].reverse().slice(0, 5).map((record, index) => (
                                <tr key={index} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-3 text-gray-300 text-sm">{record.date}</td>
                                    <td className="py-3 text-white capitalize">{record.shot_type}</td>
                                    <td className="py-3">
                                        <span className={`font-bold ${record.score >= 8 ? 'text-green-400' :
                                                record.score >= 6 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {record.score}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StatsDashboard;
