import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User, Clock, Users, Plus, CheckCircle, XCircle, Trash2, ArrowRight, Search, RefreshCw, Pencil, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import config from '../config';

const API_URL = config.API_URL;

function MakeupSchedulerPage() {
    const navigate = useNavigate();
    // State for Calendar & Modals
    const [players, setPlayers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [makeupOptions, setMakeupOptions] = useState([]);

    const [showAddPlayer, setShowAddPlayer] = useState(false);
    const [showAddClass, setShowAddClass] = useState(false);
    const [editingClass, setEditingClass] = useState(null); // { id, date, time, coach }
    const [editingPlayer, setEditingPlayer] = useState(null); // { id, name, level, default_days }

    const [newPlayer, setNewPlayer] = useState({ name: '', level: 1, default_days: [], enrollments: [''] });
    const [enrollMonth, setEnrollMonth] = useState(new Date().toISOString().slice(0, 7));
    const [enrollClasses, setEnrollClasses] = useState([]);

    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [enrollExisting, setEnrollExisting] = useState({ enrollments: [''] });

    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [monthlyTarget, setMonthlyTarget] = useState(0);
    const [showOnlyMakeup, setShowOnlyMakeup] = useState(false);
    const [playerSearchQuery, setPlayerSearchQuery] = useState('');
    const [showMonthSummary, setShowMonthSummary] = useState(false);
    const [showQuickBooking, setShowQuickBooking] = useState(false);
    const [activeActionMenu, setActiveActionMenu] = useState(null); // playerId

    // Roster Management
    const [rosterMenu, setRosterMenu] = useState(null); // { player, classId, cls }

    // Bulk Delete State
    const [selectedClassIds, setSelectedClassIds] = useState([]);

    // Series Enrollment in Edit Class
    const [addToSeries, setAddToSeries] = useState(false);

    // Updated New Class State for Series
    const [newClassMode, setNewClassMode] = useState('single'); // 'single' or 'series'
    const [newClass, setNewClass] = useState({
        date: new Date().toISOString().slice(0, 10),
        time: '',
        month: new Date().toISOString().slice(0, 7),
        weekday: 'Monday',
        student_ids: [],
        coach: '',
        max_students: 4
    });

    useEffect(() => {
        fetchPlayers();
        fetchClasses();
        fetchTarget();
    }, [currentMonth]); // Refetch when month changes

    const [monthStats, setMonthStats] = useState([]);

    const handleFinalizeMonth = async () => {
        try {
            const res = await axios.get(`${API_URL}/scheduler/month-stats?month=${currentMonth}`);
            setMonthStats(res.data);
            setShowMonthSummary(true);
        } catch (error) {
            alert("Failed to fetch month stats");
        }
    };




    const fetchTarget = async () => {
        try {
            const res = await axios.get(`${API_URL}/scheduler/targets/${currentMonth}`);
            setMonthlyTarget(res.data.target);
        } catch (error) {
            console.error("Error fetching target", error);
        }
    };

    const fetchPlayers = async () => {
        try {
            const res = await axios.get(`${API_URL}/scheduler/players`);
            setPlayers(res.data);
        } catch (error) {
            console.error("Error fetching players", error);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await axios.get(`${API_URL}/scheduler/classes?month=${currentMonth}`);
            setClasses(res.data);
        } catch (error) {
            console.error("Error fetching classes", error);
        }
    };

    const handleAddPlayer = async () => {
        try {

            const payload = { ...newPlayer };
            // Ensure default_days matches the selected enrollments so they persist
            payload.default_days = newPlayer.enrollments.filter(str => str !== '');

            // Map the array of enrollment strings to objects
            // Format: "Monday|15:00|Lorhan"
            const finalEnrollments = newPlayer.enrollments
                .filter(str => str !== '') // Remove empty picks
                .map(str => {
                    const [weekday, time, coach] = str.split('|');
                    return {
                        month: enrollMonth,
                        weekday,
                        time,
                        coach: coach === 'No Coach' ? null : coach
                    };
                });

            payload.enrollments = finalEnrollments;

            await axios.post(`${API_URL}/scheduler/players`, payload);
            setShowAddPlayer(false);
            setNewPlayer({ name: '', level: 1, default_days: [], enrollments: [''] });
            fetchPlayers();
            fetchClasses();
        } catch (error) {
            console.error("Error adding player", error);
        }
    };
    const handleDeletePlayer = async (playerId) => {
        if (!confirm("Are you sure you want to delete this player? This will also remove them from all scheduled classes.")) return;
        try {
            await axios.delete(`${API_URL}/scheduler/players/${playerId}`);
            if (selectedPlayer === playerId) setSelectedPlayer(null);
            fetchPlayers();
            fetchClasses();
        } catch (error) {
            alert("Failed to delete player");
        }
    };

    const handleEnrollExisting = async () => {
        try {
            const finalEnrollments = enrollExisting.enrollments
                .filter(str => str !== '')
                .map(str => {
                    const [weekday, time, coach] = str.split('|');
                    return {
                        month: enrollMonth,
                        weekday,
                        time,
                        coach: coach === 'No Coach' ? null : coach
                    };
                });

            await axios.post(`${API_URL}/scheduler/players/${selectedPlayer}/enroll`, { enrollments: finalEnrollments });
            setShowEnrollModal(false);
            setEnrollExisting({ enrollments: [''] });
            fetchClasses();
            alert("Enrollment successful!");
        } catch (error) {
            console.error("Error enrolling player", error);
            alert("Failed to enroll player");
        }
    };

    // Fetch classes for the dropdown when enrollMonth changes
    // Fetch classes for the dropdown when enrollMonth changes
    useEffect(() => {
        if (showAddPlayer || showEnrollModal || editingPlayer) {
            axios.get(`${API_URL}/scheduler/classes?month=${enrollMonth}`)
                .then(res => setEnrollClasses(res.data))
                .catch(err => console.error("Error fetching enroll classes", err));
        }
    }, [enrollMonth, showAddPlayer, showEnrollModal, editingPlayer]);

    const handleAddClass = async () => {
        try {
            if (newClassMode === 'single') {
                await axios.post(`${API_URL}/scheduler/classes`, {
                    date: newClass.date,
                    time: newClass.time,
                    student_ids: newClass.student_ids,
                    coach: newClass.coach,
                    max_students: newClass.max_students
                });
            } else {
                await axios.post(`${API_URL}/scheduler/classes/series`, {
                    month: newClass.month,
                    weekday: newClass.weekday,
                    time: newClass.time,
                    student_ids: newClass.student_ids,
                    coach: newClass.coach,
                    max_students: newClass.max_students
                });
            }
            setShowAddClass(false);
            // Reset form
            setNewClass({ date: new Date().toISOString().slice(0, 10), time: '', month: currentMonth, weekday: 'Monday', student_ids: [], coach: '', max_students: 4 });
            fetchClasses();
        } catch (error) {
            console.error("Error adding class", error);
            alert("Failed to create class(es)");
        }
    };

    const toggleStudentInClass = (id) => {
        const current = newClass.student_ids;
        if (current.includes(id)) {
            setNewClass({ ...newClass, student_ids: current.filter(x => x !== id) });
        } else {
            if (current.length >= 4) return; // Max 4
            setNewClass({ ...newClass, student_ids: [...current, id] });
        }
    };

    const handleDeleteClass = async (classId) => {
        if (!confirm("Are you sure you want to delete this class?")) return;
        try {
            await axios.delete(`${API_URL}/scheduler/classes/${classId}`);
            fetchClasses();
        } catch (error) {
            alert("Failed to delete class");
        }
    };

    const handleCopySchedule = async () => {
        // Calculate previous month string
        let [year, month] = currentMonth.split('-').map(Number);
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }
        const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

        if (!confirm(`Copy schedule patterns from ${prevMonthStr} to ${currentMonth}? \n(Classes will be created, but student lists will be empty)`)) return;

        try {
            await axios.post(`${API_URL}/scheduler/classes/copy`, { target_month: currentMonth });
            alert("Schedule copied successfully!");
            fetchClasses();
            fetchTarget();
        } catch (error) {
            alert("Failed to copy schedule: " + (error.response?.data?.detail || error.message));
        }
    };

    // Bulk Delete Helpers
    const toggleClassSelection = (id) => {
        setSelectedClassIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedClassIds.length} selected classes?`)) return;
        try {
            await axios.post(`${API_URL}/scheduler/classes/bulk-delete`, { class_ids: selectedClassIds });
            setSelectedClassIds([]);
            fetchClasses();
        } catch (error) {
            alert("Failed to delete classes");
        }
    };

    const handleClearMonth = async () => {
        console.log("DEBUG: Clearing month", currentMonth);
        if (!confirm(`ARE YOU SURE? This will delete EVERY class scheduled for ${currentMonth}. This cannot be undone.`)) return;
        try {
            const res = await axios.delete(`${API_URL}/scheduler/classes/month/${currentMonth}`);
            console.log("DEBUG: Clear month response", res.data);
            fetchClasses();
            alert(`Month cleared! Deleted ${res.data.deleted_count} classes.`);
        } catch (error) {
            console.error("DEBUG: Clear month error", error);
            alert("Failed to clear month: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleUpdateClass = async () => {
        try {
            await axios.patch(`${API_URL}/scheduler/classes/${editingClass.id}`, {
                date: editingClass.date,
                time: editingClass.time,
                coach: editingClass.coach,
                student_ids: editingClass.student_ids,
                max_students: Number(editingClass.max_students) || 4
            });

            // Series Update Logic
            if (addToSeries) {
                // Find original time to propagate changes to siblings matching the OLD time
                const originalClass = classes.find(c => c.id === editingClass.id);
                const originalTime = originalClass ? originalClass.time : editingClass.time;

                // 1. Propagate properties (Time, Coach, Max Slots)
                await axios.post(`${API_URL}/scheduler/classes/${editingClass.id}/propagate?match_time=${originalTime}`);

                // 2. Enroll current roster in series (Existing Logic)
                if (editingClass.student_ids.length > 0) {
                    const dateObj = new Date(editingClass.date + 'T00:00:00');
                    const month = editingClass.date.slice(0, 7);
                    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                    const enrollments = [{
                        month,
                        weekday,
                        time: editingClass.time,
                        coach: editingClass.coach
                    }];

                    // Iterate everyone in the roster and ensure they are enrolled in series
                    for (const pid of editingClass.student_ids) {
                        await axios.post(`${API_URL}/scheduler/players/${pid}/enroll`, { enrollments });
                    }
                }
            }

            setEditingClass(null);
            fetchClasses();
        } catch (error) {
            alert("Failed to update class");
        }
    };

    const handleFindMakeup = async (playerId) => {
        setSelectedPlayer(playerId);
        try {
            const res = await axios.get(`${API_URL}/scheduler/makeup-options/${playerId}?month=${currentMonth}`);
            setMakeupOptions(res.data);
            setShowQuickBooking(true);
        } catch (error) {
            console.error("Error finding makeup options", error);
        }
    };

    const handleBookMakeup = async (classId, useCredit) => {
        try {
            await axios.post(`${API_URL}/scheduler/book`, {
                class_id: classId,
                player_id: selectedPlayer,
                use_credit: useCredit
            });
            alert('Makeup booked successfully!');
            fetchClasses();
            fetchPlayers();
            // Don't refresh options if it's the quick booking modal, just close it
            if (showQuickBooking) {
                setShowQuickBooking(false);
            } else {
                handleFindMakeup(selectedPlayer); // Refresh options for profile view
            }
        } catch (error) {
            alert('Failed: ' + (error.response?.data?.detail || "Unknown error"));
        }
    };

    const handleAdjustCredits = async (playerId, amount) => {
        try {
            await axios.post(`${API_URL}/scheduler/players/${playerId}/credits?amount=${amount}`);
            fetchPlayers();
            setActiveActionMenu(null);
        } catch (error) {
            alert("Failed to adjust credits");
        }
    };

    const handleRemoveFromRoster = async (classId, playerId, awardCredit) => {
        try {
            await axios.post(`${API_URL}/scheduler/classes/${classId}/roster/${playerId}/remove`, {
                award_credit: awardCredit
            });
            fetchClasses();
            fetchPlayers();
            if (selectedPlayer === playerId) handleFindMakeup(playerId);
        } catch (error) {
            console.error("Error removing from roster", error);
        }
    };

    const handleMarkAttendance = async (classId, playerId, status) => {
        if (status === 'absent' && !confirm("Mark student absent? They will get 1 makeup.")) return;
        try {
            await axios.post(`${API_URL}/scheduler/classes/${classId}/attendance/${playerId}`, {
                status: status
            });
            fetchClasses();
            fetchPlayers();
        } catch (error) {
            console.error("Error marking attendance", error);
        }
    };

    const handleUpdatePlayer = async () => {
        try {
            const originalPlayer = players.find(p => p.id === editingPlayer.id);
            const originalDays = originalPlayer?.default_days || [];
            const newDays = editingPlayer.default_days.filter(d => d && !originalDays.includes(d));

            await axios.patch(`${API_URL}/scheduler/players/${editingPlayer.id}`, {
                name: editingPlayer.name,
                level: editingPlayer.level,
                default_days: editingPlayer.default_days,
                makeup_credits: editingPlayer.makeup_credits
            });

            // If there are new weekly classes, enroll them
            if (newDays.length > 0) {
                const newEnrollments = newDays.map(d => {
                    const [weekday, time, coach] = d.split('|');
                    return { month: currentMonth, weekday, time, coach };
                });
                await axios.post(`${API_URL}/scheduler/players/${editingPlayer.id}/enroll`, {
                    enrollments: newEnrollments
                });
            }

            // If there are REMOVED weekly classes, unenroll them
            const removedDays = originalDays.filter(d => d && !editingPlayer.default_days.includes(d));
            if (removedDays.length > 0) {
                const removedEnrollments = removedDays.map(d => {
                    const [weekday, time, coach] = d.split('|');
                    return { month: currentMonth, weekday, time, coach };
                });
                await axios.post(`${API_URL}/scheduler/players/${editingPlayer.id}/unenroll`, {
                    enrollments: removedEnrollments
                });
            }

            if (newDays.length > 0 || removedDays.length > 0) {
                alert(`Updated player schedule for ${currentMonth}: +${newDays.length} added, -${removedDays.length} removed.`);
            } else {
                alert("Player profile updated.");
            }

            setEditingPlayer(null);
            fetchPlayers();
            fetchClasses();
        } catch (error) {
            alert("Failed to update player: " + (error.response?.data?.detail || error.message));
        }
    };

    // Level Colors
    const getLevelColor = (level) => {
        switch (level) {
            case 1: return 'bg-white text-gray-900 border-gray-300';
            case 2: return 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50';
            case 3: return 'bg-pink-500/30 text-pink-300 border-pink-500/50';
            case 4: return 'bg-green-500/30 text-green-300 border-green-500/50';
            case 5: return 'bg-blue-500/30 text-blue-300 border-blue-500/50';
            default: return 'bg-gray-700 text-gray-400 border-gray-600';
        }
    };

    // Coach Color Generator
    const getCoachStyle = (coachName) => {
        if (!coachName) return 'bg-gray-700 border-gray-600';

        // Simple hash to pick a color
        let hash = 0;
        for (let i = 0; i < coachName.length; i++) {
            hash = coachName.charCodeAt(i) + ((hash << 5) - hash);
        }

        const colors = [
            'bg-blue-900/40 border-blue-500/50',
            'bg-green-900/40 border-green-500/50',
            'bg-purple-900/40 border-purple-500/50',
            'bg-orange-900/40 border-orange-500/50',
            'bg-pink-900/40 border-pink-500/50',
            'bg-teal-900/40 border-teal-500/50',
            'bg-indigo-900/40 border-indigo-500/50',
            'bg-rose-900/40 border-rose-500/50',
        ];

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    // Generate Unique Class Options for Dropdown
    const getClassOptions = (sourceClasses) => {
        const options = new Set();
        (sourceClasses || []).forEach(cls => { // Safety check
            try {
                // Fix: Parse YYYY-MM-DD explicitly to avoid timezone shifts
                const [y, m, d] = cls.date.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d); // Month is 0-indexed

                if (isNaN(dateObj.getTime())) return;

                const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                const coach = cls.coach || 'No Coach';
                options.add(`${weekday}|${cls.time}|${coach}`);
            } catch (e) {
                console.error("Date parse error", e);
            }
        });
        return Array.from(options).sort();
    };

    // Calculate Week Days for Calendar View (Simulation for now: Group by Date)
    const groupedClasses = classes.reduce((acc, cls) => {
        if (!acc[cls.date]) acc[cls.date] = [];
        acc[cls.date].push(cls);
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedClasses).sort();

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-all"
                            title="Back to Landing Page"
                        >
                            <Home size={20} />
                        </button>
                        Beach Tennis Scheduler
                    </h1>

                    <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-lg border border-gray-700">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Month Target</span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    className="w-12 bg-gray-900 border border-gray-600 rounded text-center text-sm"
                                    value={monthlyTarget}
                                    onChange={async (e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setMonthlyTarget(val);
                                        await axios.post(`${API_URL}/scheduler/targets/${currentMonth}`, { target: val });
                                    }}
                                />
                                <span className="text-xs text-gray-500">classes</span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-gray-600 mx-2"></div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearMonth}
                                className="bg-red-900/40 text-red-400 hover:bg-red-800/40 px-3 py-2 rounded-lg border border-red-900/50 flex items-center gap-2 transition-all"
                                title="Delete All Classes in this Month"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={() => setShowAddPlayer(true)}
                                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Plus size={18} /> New Player
                            </button>
                            <button
                                onClick={() => {
                                    setNewClass(prev => ({ ...prev, month: currentMonth }));
                                    setShowAddClass(true);
                                }}
                                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Plus size={18} /> New Class
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                {showAddPlayer && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-2xl w-96 border border-gray-700">
                            <h3 className="text-xl font-bold mb-4">Add New Player</h3>
                            <input
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-3"
                                placeholder="Name"
                                value={newPlayer.name}
                                onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })}
                            />
                            <div className="flex gap-2 items-center mb-3">
                                <span>Level:</span>
                                <select
                                    className="bg-gray-900 border border-gray-600 rounded p-1 flex-1"
                                    value={newPlayer.level}
                                    onChange={e => setNewPlayer({ ...newPlayer, level: parseInt(e.target.value) })}
                                >
                                    {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="block text-xs text-gray-400 mb-1">Assign to Class Series (Optional)</label>
                                {/* Enrollment Month Picker */}
                                <div className="flex gap-2 items-center mb-2">
                                    <span className="text-[10px] text-gray-500">For Month:</span>
                                    <input
                                        type="month"
                                        className="bg-gray-900 border border-gray-600 rounded p-1 text-xs"
                                        value={enrollMonth}
                                        onChange={e => setEnrollMonth(e.target.value)}
                                    />
                                </div>

                                {newPlayer.enrollments.map((enr, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <select
                                            className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                            value={enr}
                                            onChange={e => {
                                                const updated = [...newPlayer.enrollments];
                                                updated[idx] = e.target.value;
                                                setNewPlayer({ ...newPlayer, enrollments: updated });
                                            }}
                                        >
                                            <option value="">-- Select Class --</option>
                                            {getClassOptions(enrollClasses).map(opt => {
                                                const [day, time, coach] = opt.split('|');
                                                return (
                                                    <option key={opt} value={opt}>
                                                        {day} {time} ({coach})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <button
                                            onClick={() => {
                                                const updated = newPlayer.enrollments.filter((_, i) => i !== idx);
                                                setNewPlayer({ ...newPlayer, enrollments: updated.length ? updated : [''] });
                                            }}
                                            className="text-red-400 hover:text-red-300"
                                            title="Remove"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setNewPlayer({ ...newPlayer, enrollments: [...newPlayer.enrollments, ''] })}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                                >
                                    <Plus size={14} /> Add Another Class
                                </button>

                                <p className="text-[10px] text-gray-500 mt-2">
                                    Automatically enrolls in matching classes for {enrollMonth}.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowAddPlayer(false)} className="text-gray-400 hover:text-white">Cancel</button>
                                <button onClick={handleAddPlayer} className="bg-blue-600 px-4 py-1 rounded">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {showEnrollModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-2xl w-96 border border-gray-700">
                            <h3 className="text-xl font-bold mb-4">Enroll in Monthly Series</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Enroll <strong>{players.find(p => p.id === selectedPlayer)?.name}</strong> in all matching classes for the month.
                            </p>

                            <div className="mb-4">
                                <div className="flex gap-2 items-center mb-2">
                                    <span className="text-[10px] text-gray-500">For Month:</span>
                                    <input
                                        type="month"
                                        className="bg-gray-900 border border-gray-600 rounded p-1 text-xs"
                                        value={enrollMonth}
                                        onChange={e => setEnrollMonth(e.target.value)}
                                    />
                                </div>

                                {enrollExisting.enrollments.map((enr, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <select
                                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm"
                                            value={enr}
                                            onChange={e => {
                                                const updated = [...enrollExisting.enrollments];
                                                updated[idx] = e.target.value;
                                                setEnrollExisting({ ...enrollExisting, enrollments: updated });
                                            }}
                                        >
                                            <option value="">-- Select Class --</option>
                                            {getClassOptions(enrollClasses).map(opt => {
                                                const [day, time, coach] = opt.split('|');
                                                return (
                                                    <option key={opt} value={opt}>
                                                        {day} {time} ({coach})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <button
                                            onClick={() => {
                                                const updated = enrollExisting.enrollments.filter((_, i) => i !== idx);
                                                setEnrollExisting({ ...enrollExisting, enrollments: updated.length ? updated : [''] });
                                            }}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setEnrollExisting({ ...enrollExisting, enrollments: [...enrollExisting.enrollments, ''] })}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                                >
                                    <Plus size={14} /> Add Another Class
                                </button>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-white">Cancel</button>
                                <button onClick={handleEnrollExisting} className="bg-blue-600 px-4 py-1 rounded">Enroll</button>
                            </div>
                        </div>
                    </div>
                )
                }

                {
                    showAddClass && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto">
                            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-gray-700 my-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">New Class</h3>
                                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                                        <button
                                            onClick={() => setNewClassMode('single')}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${newClassMode === 'single' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Single
                                        </button>
                                        <button
                                            onClick={() => setNewClassMode('series')}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${newClassMode === 'series' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Series
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mb-6">
                                    {newClassMode === 'single' ? 'Add a single class session on a specific date.' : 'Create a repeating class for every occurrence of a weekday in the month.'}
                                </p>

                                <div className="space-y-4">
                                    {newClassMode === 'single' ? (
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Date</label>
                                            <input type="date" className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                                value={newClass.date} onChange={e => setNewClass({ ...newClass, date: e.target.value })} />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Month</label>
                                                <input type="month" className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                                    value={newClass.month} onChange={e => setNewClass({ ...newClass, month: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Weekday</label>
                                                <select className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                                    value={newClass.weekday} onChange={e => setNewClass({ ...newClass, weekday: e.target.value })}
                                                >
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Time</label>
                                        <input type="time" className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                            value={newClass.time} onChange={e => setNewClass({ ...newClass, time: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Coach Name</label>
                                        <input className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                            placeholder="Optional"
                                            value={newClass.coach} onChange={e => setNewClass({ ...newClass, coach: e.target.value })}
                                            list="coaches_new"
                                        />
                                        <datalist id="coaches_new">
                                            <option value="Gui" />
                                            <option value="Matheus" />
                                            <option value="Duda" />
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Max Slots</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                            value={newClass.max_students}
                                            onChange={e => setNewClass({ ...newClass, max_students: parseInt(e.target.value) || 4 })}
                                        />
                                    </div>


                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button onClick={() => setShowAddClass(false)} className="text-gray-400 hover:text-white">Cancel</button>
                                    <button onClick={handleAddClass} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-bold">
                                        {newClassMode === 'single' ? 'Create Class' : `Create Series`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }


                {/* Edit Class Modal */}
                {
                    editingClass && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700">
                                <h3 className="text-xl font-bold mb-4">Edit Class</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                            value={editingClass.date}
                                            onChange={e => setEditingClass({ ...editingClass, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Time</label>
                                        <input
                                            type="time"
                                            className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                            value={editingClass.time}
                                            onChange={e => setEditingClass({ ...editingClass, time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Coach</label>
                                        <input
                                            className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                            value={editingClass.coach || ''}
                                            onChange={e => setEditingClass({ ...editingClass, coach: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Max Slots</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                            value={editingClass.max_students}
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                setEditingClass({ ...editingClass, max_students: isNaN(val) ? '' : val });
                                            }}
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-gray-700">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Class Roster ({editingClass.student_ids.length}/{editingClass.max_students || 4})</label>
                                        <div className="space-y-2 mb-4">
                                            {editingClass.student_ids.map(sid => {
                                                const p = players.find(x => x.id === sid);
                                                return (
                                                    <div key={sid} className="flex justify-between items-center bg-gray-900/50 p-2 rounded border border-gray-700">
                                                        <span className="text-sm font-medium">{p?.name || 'Unknown'}</span>
                                                        <button
                                                            onClick={() => setEditingClass({
                                                                ...editingClass,
                                                                student_ids: editingClass.student_ids.filter(id => id !== sid)
                                                            })}
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {editingClass.student_ids.length < 4 && (
                                            <div className="space-y-2">
                                                <label className="block text-[10px] text-gray-500 uppercase">Add Existing Student</label>
                                                <select
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs"
                                                    onChange={e => {
                                                        const sid = e.target.value;
                                                        if (sid && !editingClass.student_ids.includes(sid)) {
                                                            setEditingClass({
                                                                ...editingClass,
                                                                student_ids: [...editingClass.student_ids, sid]
                                                            });
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                >
                                                    <option value="">-- Select Student --</option>
                                                    {players
                                                        .filter(p => !editingClass.student_ids.includes(p.id))
                                                        .sort((a, b) => a.name.localeCompare(b.name))
                                                        .map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} (Lvl {p.level})</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-700">
                                        <input
                                            type="checkbox"
                                            id="addToSeries"
                                            checked={addToSeries}
                                            onChange={e => setAddToSeries(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-500 bg-gray-900"
                                        />
                                        <label htmlFor="addToSeries" className="text-xs text-gray-400 select-none cursor-pointer">
                                            Update entire series (Time, Coach, Slots & Roster) for <strong>{new Date(editingClass.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long' })}</strong>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button onClick={() => setEditingClass(null)} className="text-gray-400 hover:text-white">Cancel</button>
                                    <button onClick={handleUpdateClass} className="bg-blue-600 px-4 py-2 rounded">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Edit Player Modal */}
                {editingPlayer && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700">
                            <h3 className="text-xl font-bold mb-4">Edit Player Profile</h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Name</label>
                                    <input
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                        value={editingPlayer.name}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Level</label>
                                    <select
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                        value={editingPlayer.level}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, level: parseInt(e.target.value) })}
                                    >
                                        {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Makeup Credits</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                                        value={editingPlayer.makeup_credits !== undefined ? editingPlayer.makeup_credits : 0}
                                        onChange={e => setEditingPlayer({ ...editingPlayer, makeup_credits: parseInt(e.target.value) })}
                                    />
                                </div>

                                {/* Class Enrollments */}
                                <div className="pt-4 border-t border-gray-700">
                                    <div className="flex gap-2 items-center mb-2 justify-between">
                                        <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider">Default Enrollments</label>
                                        <div className="flex gap-1 items-center">
                                            <span className="text-[10px] text-gray-500">Source:</span>
                                            <input
                                                type="month"
                                                className="bg-gray-900 border border-gray-600 rounded p-0.5 text-[10px]"
                                                value={enrollMonth}
                                                onChange={e => setEnrollMonth(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {(editingPlayer.default_days || []).map((enr, idx) => (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <select
                                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs"
                                                value={enr}
                                                onChange={e => {
                                                    const updated = [...editingPlayer.default_days];
                                                    updated[idx] = e.target.value;
                                                    setEditingPlayer({ ...editingPlayer, default_days: updated });
                                                }}
                                            >
                                                <option value="">-- Select Class --</option>
                                                {getClassOptions(enrollClasses).map(opt => {
                                                    const [day, time, coach] = opt.split('|');
                                                    return (
                                                        <option key={opt} value={opt}>
                                                            {day} {time} ({coach})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const updated = editingPlayer.default_days.filter((_, i) => i !== idx);
                                                    setEditingPlayer({ ...editingPlayer, default_days: updated });
                                                }}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setEditingPlayer({ ...editingPlayer, default_days: [...(editingPlayer.default_days || []), ''] })}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                                    >
                                        <Plus size={12} /> Add Weekly Class
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                                <button
                                    onClick={() => {
                                        if (confirm("Delete this player?")) {
                                            handleDeletePlayer(editingPlayer.id);
                                            setEditingPlayer(null);
                                        }
                                    }}
                                    className="text-red-500 hover:text-red-400 text-sm font-medium"
                                >
                                    Delete Student
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingPlayer(null)} className="text-gray-400 hover:text-white">Cancel</button>
                                    <button onClick={handleUpdatePlayer} className="bg-blue-600 px-4 py-2 rounded font-bold">Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {rosterMenu && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setRosterMenu(null)}>
                        <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{rosterMenu.player?.name}</h3>
                                <button onClick={() => setRosterMenu(null)} className="text-gray-500 hover:text-white"><XCircle size={20} /></button>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        handleMarkAttendance(rosterMenu.classId, rosterMenu.player.id, 'present');
                                        setRosterMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 bg-gray-900 border border-gray-700 hover:border-green-500 p-4 rounded-xl transition-all group"
                                >
                                    <div className="p-2 bg-green-900/40 text-green-400 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">Check In</div>
                                        <div className="text-xs text-gray-500">Mark student as present</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setEditingPlayer(rosterMenu.player);
                                        setRosterMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 bg-gray-900 border border-gray-700 hover:border-blue-500 p-4 rounded-xl transition-all group"
                                >
                                    <div className="p-2 bg-blue-900/40 text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <User size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">Edit Student</div>
                                        <div className="text-xs text-gray-500">Profile, level, or delete</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        handleMarkAttendance(rosterMenu.classId, rosterMenu.player.id, 'absent');
                                        setRosterMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 bg-gray-900 border border-gray-700 hover:border-orange-500 p-4 rounded-xl transition-all group"
                                >
                                    <div className="p-2 bg-orange-900/40 text-orange-400 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        <Clock size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">Make Up (Open Slot)</div>
                                        <div className="text-xs text-gray-500">Adds strikethrough & opens a spot</div>
                                    </div>
                                </button>

                                {rosterMenu.cls.attendance?.[rosterMenu.player.id] && (
                                    <button
                                        onClick={() => {
                                            handleMarkAttendance(rosterMenu.classId, rosterMenu.player.id, '');
                                            setRosterMenu(null);
                                        }}
                                        className="w-full flex items-center gap-3 bg-gray-900 border border-gray-700 hover:border-gray-500 p-4 rounded-xl transition-all group"
                                    >
                                        <div className="p-2 bg-gray-800 text-gray-400 rounded-lg group-hover:bg-gray-600 group-hover:text-white transition-colors">
                                            <RefreshCw size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-white">Clear Status</div>
                                            <div className="text-xs text-gray-500">Remove check-in or absent status</div>
                                        </div>
                                    </button>
                                )}

                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <button
                                        onClick={() => {
                                            if (confirm("Remove student from this specific class?")) {
                                                handleRemoveFromRoster(rosterMenu.classId, rosterMenu.player.id, false);
                                                setRosterMenu(null);
                                            }
                                        }}
                                        className="w-full text-red-500 hover:text-red-400 text-sm font-medium py-2 flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={14} /> Remove from this Class
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* WEEKLY CALENDAR GRID */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 overflow-x-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calendar className="text-blue-400" /> Weekly Schedule
                        </h2>
                        <div className="flex items-center gap-4">
                            {selectedClassIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 animate-pulse"
                                >
                                    <Trash2 size={14} /> Delete ({selectedClassIds.length})
                                </button>
                            )}
                            <button
                                onClick={handleFinalizeMonth}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600/20 text-yellow-500 rounded hover:bg-yellow-600/30 transition-colors border border-yellow-600/50 mr-2"
                            >
                                <CheckCircle size={16} />
                                <span className="text-sm font-bold">Finalize Month</span>
                            </button>
                            <button
                                onClick={handleCopySchedule}
                                className="text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                                title="Copy class patterns from the previous month"
                            >
                                Copy Previous Month
                            </button>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-400">Viewing Month:</label>
                                <input
                                    type="month"
                                    className="bg-gray-900 border border-gray-600 rounded p-1 text-white"
                                    value={currentMonth}
                                    onChange={e => setCurrentMonth(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 min-w-max pb-4">
                        {sortedDates.length === 0 && <div className="text-transparent">Placeholder for empty month</div>}
                        {sortedDates.map(date => (
                            <div key={date} className="w-64 flex-shrink-0">
                                <div className="text-center font-bold bg-gray-700 py-2 rounded-t-lg border-b border-gray-600">
                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                                </div>
                                <div className="bg-gray-800/80 border border-gray-700 rounded-b-lg p-3 space-y-4 min-h-[400px]">
                                    {groupedClasses[date].map(cls => (
                                        <div key={cls.id} className={`p-3 rounded border shadow-sm relative group transition-colors ${selectedClassIds.includes(cls.id)
                                            ? 'bg-red-900/50 border-red-500'
                                            : getCoachStyle(cls.coach)
                                            }`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedClassIds.includes(cls.id)}
                                                        onChange={() => toggleClassSelection(cls.id)}
                                                        className="w-4 h-4 rounded border-gray-500 bg-gray-800"
                                                    />
                                                    <div className="font-bold text-lg text-blue-300">{cls.time}</div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => {
                                                        setEditingClass({
                                                            ...cls,
                                                            student_ids: cls.student_ids || [],
                                                            max_students: cls.max_students || 4
                                                        });
                                                        setAddToSeries(false); // Reset checkbox
                                                    }} className="text-gray-500 hover:text-white" title="Edit Class">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClass(cls.id)} className="text-gray-500 hover:text-red-500" title="Delete Class">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mb-2 flex justify-between uppercase tracking-wider">
                                                <span>Coach: {cls.coach || 'Unassigned'}</span>
                                                <span className="text-blue-400 font-bold">
                                                    {cls.student_ids.filter(sid => cls.attendance?.[sid] !== 'absent').length}/{cls.max_students || 4} Slots
                                                </span>
                                            </div>

                                            {/* Roster */}
                                            <div className="space-y-1 mt-2">
                                                {cls.student_ids.map(sid => {
                                                    const p = players.find(x => x.id === sid);
                                                    const attendanceStatus = cls.attendance?.[sid];
                                                    const isPresent = attendanceStatus === 'present';
                                                    const isAbsent = attendanceStatus === 'absent';

                                                    return (
                                                        <div key={sid} className="flex justify-between items-center text-sm bg-gray-900/40 px-2 py-1.5 rounded group/student border border-transparent hover:border-gray-700/50">
                                                            <button
                                                                onClick={() => setRosterMenu({ player: p, classId: cls.id, cls: cls })}
                                                                className={`truncate flex-1 flex items-center gap-1.5 text-left transition-colors hover:text-blue-400 ${isAbsent ? 'line-through text-gray-500 italic' : ''}`}
                                                                title={`Click to Manage ${p?.name || 'Student'}`}
                                                            >
                                                                {isPresent && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                                                                <span>{p?.name || 'Unknown'}</span>
                                                            </button>
                                                            <div className="flex gap-1 opacity-0 group-hover/student:opacity-100 transition-opacity ml-2">
                                                                <button
                                                                    onClick={() => handleFindMakeup(sid)}
                                                                    title="See History"
                                                                    className="text-gray-500 hover:text-blue-400"
                                                                >
                                                                    <Search size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {/* Empty Slots */}
                                                {Array.from({ length: Math.max(0, (cls.max_students || 4) - cls.student_ids.length) }).map((_, i) => (
                                                    <div key={i} className="text-[10px] text-gray-600 border border-dashed border-gray-700 rounded py-1 text-center bg-gray-900/20">
                                                        Empty Slot
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Profile & Makeup Options */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Players Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 h-[500px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <User className="text-green-400" /> Student List
                                </h2>
                                <button
                                    onClick={() => setShowOnlyMakeup(!showOnlyMakeup)}
                                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${showOnlyMakeup ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white'}`}
                                >
                                    {showOnlyMakeup ? 'Show All' : `Make Up List (${players.filter(p => p.makeup_credits > 0).length})`}
                                </button>
                            </div>
                            <div className="px-1 pb-2">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-xs text-white placeholder-gray-500"
                                    value={playerSearchQuery}
                                    onChange={e => setPlayerSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                                {players
                                    .filter(p => !showOnlyMakeup || p.makeup_credits > 0)
                                    .filter(p => p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()))
                                    .sort((a, b) => a.name.localeCompare(b.name)).map(player => {

                                        // Calculate Monthly Attendance
                                        // Count classes in 'classes' (which is filtered by currentMonth) where this player is 'present'
                                        const monthlyAttendance = classes.filter(c => c.attendance?.[player.id] === 'present').length;
                                        const targetMet = monthlyTarget > 0 && monthlyAttendance >= monthlyTarget;

                                        return (
                                            <div
                                                key={player.id}
                                                className={`group relative flex items-center p-2 rounded text-sm cursor-pointer transition-colors ${selectedPlayer === player.id ? 'bg-blue-900/30 text-blue-300 border border-blue-800' : 'hover:bg-gray-700/50 text-gray-300'}`}
                                                onClick={() => {
                                                    setSelectedPlayer(player.id);
                                                    handleFindMakeup(player.id);
                                                }}
                                            >
                                                {/* Action Menu Popover */}
                                                {activeActionMenu === player.id && (
                                                    <div className="absolute left-10 top-2 z-[60] bg-gray-800 border-2 border-orange-500 rounded-xl shadow-2xl p-1 flex flex-col gap-1 min-w-[120px] scale-in-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAdjustCredits(player.id, 1); }}
                                                            className="flex items-center gap-2 px-3 py-2 hover:bg-orange-500/10 text-orange-400 rounded-lg transition-colors text-xs font-bold"
                                                        >
                                                            <Plus size={14} /> Add 1 Credit
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleFindMakeup(player.id); setActiveActionMenu(null); }}
                                                            className="flex items-center gap-2 px-3 py-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors text-xs font-bold"
                                                        >
                                                            <Search size={14} /> Book Makeup
                                                        </button>
                                                        <div className="border-t border-gray-700 my-1" />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveActionMenu(null); }}
                                                            className="px-3 py-1 text-center text-[10px] text-gray-500 hover:text-white"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 w-full">
                                                    {/* ALWAYS-VISIBLE Plus Action Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveActionMenu(activeActionMenu === player.id ? null : player.id);
                                                        }}
                                                        className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg shadow-lg shadow-orange-950/20 transition-all hover:scale-110 active:scale-95 ${activeActionMenu === player.id ? 'bg-white text-orange-600' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}
                                                        title="Quick Actions"
                                                    >
                                                        <Plus size={14} strokeWidth={3} />
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold truncate">{player.name}</span>
                                                            {targetMet && <span className="text-sm">🏆</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                            <span className={`px-1 rounded border ${getLevelColor(player.level)}`}>Lvl {player.level}</span>
                                                            {player.makeup_credits > 0 ? (
                                                                <span className="text-orange-500/80 font-black tracking-wider uppercase">
                                                                    {player.makeup_credits} Makeup{player.makeup_credits > 1 ? 's' : ''}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-600 italic">0 Makeups</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingPlayer(player);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white transition-all shadow-sm"
                                                        title="Edit Student Profile"
                                                    >
                                                        <User size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    </div>

                    {/* Reschedule Options & Profile Details */}
                    <div className="lg:col-span-2">
                        {selectedPlayer ? (
                            <div className="bg-gray-800 rounded-2xl p-6 border border-blue-900/50 shadow-2xl relative min-h-[500px]">
                                <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-white">
                                                {players.find(p => p.id === selectedPlayer)?.name}
                                            </h2>
                                            <button
                                                onClick={() => setEditingPlayer(players.find(p => p.id === selectedPlayer))}
                                                className="text-gray-500 hover:text-yellow-400 transition-colors"
                                                title="Edit Profile"
                                            >
                                                <User size={18} />
                                            </button>
                                        </div>
                                        <div className="flex gap-3 text-sm text-gray-400 mt-2">
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Level {players.find(p => p.id === selectedPlayer)?.level}</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Makeups Pending: {players.find(p => p.id === selectedPlayer)?.makeup_credits || 0}</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Attended: {players.find(p => p.id === selectedPlayer)?.stats?.classes_attended || 0}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedPlayer(null)} className="text-gray-500 hover:text-white">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                {/* Attendance History */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Recent Attendance History</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {players.find(p => p.id === selectedPlayer)?.attendance_history?.length > 0 ? (
                                            [...players.find(p => p.id === selectedPlayer).attendance_history].reverse().slice(0, 10).map((h, i) => (
                                                <div key={i} className="flex-shrink-0 bg-gray-900/60 border border-gray-700 px-4 py-3 rounded-xl text-center min-w-[100px]">
                                                    <div className="text-gray-300 font-bold">{new Date(h.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                                    <div className="text-gray-500 text-[10px] mt-1 pr-1">{h.time}</div>
                                                    {h.coach && <div className="text-blue-500/80 text-[9px] mt-1">Coach {h.coach.split(' ')[0]}</div>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-600 italic py-4">No classes attended yet. Start marking attendance to see the history here!</div>
                                        )}
                                    </div>
                                </div>

                                {/* Makeup Search Results */}
                                <h3 id="makeup-section" className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 pt-6 border-t border-gray-700/50">
                                    <Clock size={14} className="text-purple-400" /> Available Makeup Slots
                                </h3>

                                {makeupOptions.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 bg-gray-900/20 rounded-2xl border border-dashed border-gray-700">
                                        <p className="mb-1">No upcoming slots found matching Level {players.find(p => p.id === selectedPlayer)?.level}.</p>
                                        <p className="text-xs text-gray-600">Only classes with available capacity are shown.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {makeupOptions.map(opt => (
                                            <div key={opt.id} className="bg-gray-900/80 border border-gray-700 p-4 rounded-xl hover:border-blue-500 transition-all group shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-lg font-bold text-blue-300 block leading-tight">{opt.time}</span>
                                                        <span className="text-sm text-gray-400">{new Date(opt.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => handleBookMakeup(opt.id, true)}
                                                            className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg shadow-orange-950/20 transition-colors"
                                                            title="Use Makeup"
                                                        >
                                                            Use Makeup
                                                        </button>
                                                        <button
                                                            onClick={() => handleBookMakeup(opt.id, false)}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg shadow-blue-950/20 transition-colors"
                                                            title="Regular Booking (No Makeup)"
                                                        >
                                                            Regular Add
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-gray-800">
                                                    <div className="flex justify-between text-[10px] mb-2">
                                                        <span className="text-gray-500">Coach: {opt.coach || 'Unassigned'}</span>
                                                        <span className="text-gray-400">
                                                            {opt.student_ids.filter(sid => opt.attendance?.[sid] !== 'absent').length}/{opt.max_students} Students
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {opt.student_ids.length > 0 ? opt.student_ids.map(sid => {
                                                            const p = players.find(x => x.id === sid);
                                                            return (
                                                                <span key={sid} className="bg-gray-800 px-1.5 py-0.5 rounded text-[9px] text-gray-400 border border-gray-700">
                                                                    {p?.name?.split(' ')[0]} (L{p?.level})
                                                                </span>
                                                            )
                                                        }) : <span className="text-[9px] text-gray-600 italic">Empty Class</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-700/50 rounded-2xl p-12 bg-gray-800/20">
                                <Search size={48} className="mb-4 text-gray-700" />
                                <p className="text-lg font-medium">Select a student profile</p>
                                <p className="text-sm">Click on a name in the list or use the search icon in a class roster to see history and makeup options.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Month Summary Modal */}
            {showMonthSummary && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-8">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-4xl border border-gray-700 flex flex-col max-h-full">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Month Summary: {new Date(currentMonth + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">Review attendance and rollover credits.</p>
                            </div>
                            <button onClick={() => setShowMonthSummary(false)} className="text-gray-400 hover:text-white">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 text-sm border-b border-gray-700">
                                        <th className="p-3">Student</th>
                                        <th className="p-3 text-center">Level</th>
                                        <th className="p-3 text-center">Target ({monthlyTarget})</th>
                                        <th className="p-3 text-center">Classes Attended</th>
                                        <th className="p-3 text-center">Credits Carrying Over</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {players.sort((a, b) => a.name.localeCompare(b.name)).map(player => {
                                        const monthlyAttendance = classes.filter(c => c.attendance?.[player.id] === 'present').length;
                                        const targetMet = monthlyTarget > 0 && monthlyAttendance >= monthlyTarget;

                                        return (
                                            <tr key={player.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                                                <td className="p-3 font-medium text-white">{player.name}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getLevelColor(player.level)}`}>
                                                        L{player.level}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {targetMet ? <span className="text-xl">🏆</span> : <span className="text-gray-600">-</span>}
                                                </td>
                                                <td className="p-3 text-center font-bold text-blue-300">
                                                    {monthlyAttendance}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {player.makeup_credits > 0 ? (
                                                        <span className="bg-orange-900/40 text-orange-400 px-2 py-1 rounded font-bold">
                                                            {player.makeup_credits} Credit{player.makeup_credits !== 1 ? 's' : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowMonthSummary(false)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold"
                                >
                                    Close Summary
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Month Summary Modal */}
            {showMonthSummary && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CheckCircle className="text-yellow-500" />
                                Month Finalization: {new Date(currentMonth + '-02').toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button onClick={() => setShowMonthSummary(false)} className="text-gray-400 hover:text-white">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 text-sm border-b border-gray-700">
                                        <th className="p-2 font-medium">Student</th>
                                        <th className="p-2 font-medium text-center">Classes Attended</th>
                                        <th className="p-2 font-medium text-center text-red-400">Missed Classes</th>
                                        <th className="p-2 font-medium text-center">Target</th>
                                        <th className="p-2 font-medium text-center">Status</th>
                                        <th className="p-2 font-medium text-center text-blue-400">Rollover Credits</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {monthStats.map(stat => (
                                        <tr key={stat.student_id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                            <td className="p-2 font-medium text-white">{stat.name}</td>
                                            <td className="p-2 text-center text-gray-300">{stat.attended}</td>
                                            <td className="p-2 text-center text-red-400 font-bold">{stat.absences}</td>
                                            <td className="p-2 text-center text-gray-500">{stat.target}</td>
                                            <td className="p-2 text-center">
                                                {stat.achieved ? (
                                                    <span className="inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full text-xs border border-yellow-500/20">
                                                        🏆 Achieved
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-center">
                                                {stat.rollover_credits > 0 ? (
                                                    <span className="text-blue-400 font-bold">+{stat.rollover_credits}</span>
                                                ) : (
                                                    <span className="text-gray-600">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-gray-700 bg-gray-900/30 flex justify-end">
                            <button
                                onClick={() => setShowMonthSummary(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition-colors"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Makeup Selection Modal */}
            {showQuickBooking && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[70] p-4">
                    <div className="bg-gray-800 rounded-3xl shadow-2xl border-2 border-orange-500/30 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-950/40">
                                        <Plus className="text-white" size={24} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Quick Book Makeup</h3>
                                        <p className="text-orange-400 font-bold text-xs">Matching Level {players.find(p => p.id === selectedPlayer)?.level} for {players.find(p => p.id === selectedPlayer)?.name}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowQuickBooking(false)}
                                className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full text-gray-400 hover:text-white transition-all"
                            >
                                <XCircle size={32} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {makeupOptions.length === 0 ? (
                                <div className="text-center py-20 bg-gray-900/40 rounded-3xl border-2 border-dashed border-gray-700">
                                    <XCircle size={48} className="mx-auto text-gray-600 mb-4" />
                                    <p className="text-xl font-bold text-gray-400">No available slots found.</p>
                                    <p className="text-sm text-gray-600 mt-2">Try checking other months or regular classes.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Select an available slot:</p>
                                    {makeupOptions.map(opt => (
                                        <div
                                            key={opt.id}
                                            onClick={() => handleBookMakeup(opt.id, true)}
                                            className="bg-gray-900 border-2 border-gray-700 p-5 rounded-2xl hover:border-orange-500 hover:bg-orange-500/5 transition-all cursor-pointer group flex justify-between items-center"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 group-hover:border-orange-500/50">
                                                    <Clock className="text-blue-400 group-hover:text-orange-400" size={20} />
                                                </div>
                                                <div>
                                                    <span className="text-2xl font-black text-white block leading-none">{opt.time}</span>
                                                    <span className="text-sm font-bold text-gray-500 group-hover:text-gray-400">
                                                        {new Date(opt.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-gray-600 uppercase mb-1">Coach {opt.coach || 'Unassigned'}</div>
                                                <button className="bg-blue-600 p-2 rounded-xl text-white font-black text-xs group-hover:bg-orange-600 transition-colors">
                                                    BOOK NOW
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-900/80 border-t border-gray-700 text-center">
                            <p className="text-[10px] text-gray-500">Only classes with matching levels and available spots are shown here.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default MakeupSchedulerPage;
