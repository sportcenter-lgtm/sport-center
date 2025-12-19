import React from 'react';
import { CheckCircle, AlertCircle, Play, Pause, RotateCcw, Camera, Receipt, XCircle } from 'lucide-react';
import config from '../config';

const AnalysisResults = ({ results }) => {
    if (!results) return null;

    const { score, feedback, processed_video_url, shot_type, keyframes, criteria_breakdown } = results;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Score Card */}
            <div className="glass-panel p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
                <h2 className="text-3xl font-bold text-white mb-2">Analysis Score</h2>
                <div className="text-6xl font-black gradient-text mb-4">{score}/10</div>
                <div className="flex justify-center gap-2">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300 capitalize">{shot_type}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${score >= 8 ? 'bg-green-500/20 text-green-400' :
                        score >= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                        }`}>
                        {score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : 'Needs Improvement'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Video Player */}
                <div className="glass-panel p-4">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Play className="w-5 h-5 text-primary" /> Video Analysis
                    </h3>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                        <video
                            controls
                            className="w-full h-full object-contain"
                            src={`${config.API_URL}/${processed_video_url}`}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>

                {/* Feedback Card */}
                <div className="glass-panel p-4">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" /> Coach's Feedback
                    </h3>
                    <div className="space-y-3">
                        {feedback.length > 0 ? (
                            feedback.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                                    <AlertCircle className="w-6 h-6 text-yellow-400 shrink-0" />
                                    <p className="text-gray-200 text-sm">{item}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                                <p>Perfect form! No corrections needed.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Key Moments */}
            {keyframes && (
                <div className="glass-panel p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" /> Key Moments
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/10">
                                <img
                                    src={`${config.API_URL}${keyframes.keyframe_before}`}
                                    className="w-full h-full object-cover"
                                    alt="Preparation"
                                />
                            </div>
                            <p className="text-center text-sm text-gray-400">Preparation (-1s)</p>
                        </div>
                        <div className="space-y-2">
                            <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border-2 border-primary/50 relative">
                                <div className="absolute top-2 right-2 bg-primary text-black text-xs font-bold px-2 py-0.5 rounded">
                                    IMPACT
                                </div>
                                <img
                                    src={`${config.API_URL}${keyframes.keyframe_contact}`}
                                    className="w-full h-full object-cover"
                                    alt="Contact"
                                />
                            </div>
                            <p className="text-center text-sm font-bold text-primary">Contact Point</p>
                        </div>
                        <div className="space-y-2">
                            <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/10">
                                <img
                                    src={`${config.API_URL}${keyframes.keyframe_after}`}
                                    className="w-full h-full object-cover"
                                    alt="Follow Through"
                                />
                            </div>
                            <p className="text-center text-sm text-gray-400">Follow Through (+1s)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Criteria Breakdown Table */}
            {
                criteria_breakdown && criteria_breakdown.length > 0 && (
                    <div className="glass-panel p-6 overflow-hidden">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" /> Technique Analysis
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                        <th className="py-3 px-4">Criteria</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {criteria_breakdown.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4 font-medium text-white">{item.name}</td>
                                            <td className="py-4 px-4 text-center">
                                                {item.status === "Met" ? (
                                                    <div className="inline-flex items-center gap-1 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-sm font-bold">
                                                        <CheckCircle className="w-4 h-4" /> Pass
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-red-400 bg-red-400/10 px-3 py-1 rounded-full text-sm font-bold">
                                                        <XCircle className="w-4 h-4" /> Fail
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">
                                                {item.notes || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Video Playback */}
            <div className="glass-panel p-4 overflow-hidden">
                <h3 className="text-xl font-bold mb-4 px-4">Analysis Replay</h3>
                <div className="relative rounded-lg overflow-hidden bg-black/50 aspect-video mb-6">
                    <video
                        src={`${config.API_URL}/${processed_video_url}`}
                        controls
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        </div >
    );
};

export default AnalysisResults;
