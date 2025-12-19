import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, LogOut, Edit2, Save, X, Search, Activity } from 'lucide-react';
import config from '../config';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/profile');
            return;
        }
        fetchUsers();
    }, [role, navigate]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/users`);
            setUsers(response.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        navigate('/');
    };

    const handleEdit = (user) => {
        setEditingUser({ ...user });
    };

    const handleSave = async () => {
        try {
            await axios.put(`${config.API_URL}/users/${editingUser.username}`, {
                name: editingUser.name,
                email: editingUser.email,
                sport: editingUser.sport,
                role: editingUser.role
            });
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            console.error("Failed to update user", err);
            alert("Failed to update user");
        }
    };

    const handleDelete = async (username) => {
        if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            try {
                await axios.delete(`${config.API_URL}/users/${username}`);
                fetchUsers();
            } catch (err) {
                console.error("Failed to delete user", err);
                alert("Failed to delete user");
            }
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen p-8">
            <header className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Admin <span className="gradient-text">Dashboard</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
                        title="Go to my analysis"
                    >
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">My Analysis</span>
                    </button>

                    <div className="flex items-center gap-2 text-gray-300 bg-white/5 px-4 py-2 rounded-full">
                        <Shield className="w-4 h-4 text-red-400" />
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
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">User Management</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary text-sm w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="pb-3 text-gray-400 font-medium">Username</th>
                                    <th className="pb-3 text-gray-400 font-medium">Name</th>
                                    <th className="pb-3 text-gray-400 font-medium">Email</th>
                                    <th className="pb-3 text-gray-400 font-medium">Sport</th>
                                    <th className="pb-3 text-gray-400 font-medium">Verification</th>
                                    <th className="pb-3 text-gray-400 font-medium">Role</th>
                                    <th className="pb-3 text-gray-400 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filteredUsers.map((user) => (
                                    <tr key={user.username} className="group hover:bg-white/5 transition-colors">
                                        {editingUser && editingUser.username === user.username ? (
                                            <>
                                                <td className="py-3 text-gray-500">{user.username}</td>
                                                <td className="py-3">
                                                    <input
                                                        value={editingUser.name}
                                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm w-full"
                                                    />
                                                </td>
                                                <td className="py-3">
                                                    <input
                                                        value={editingUser.email}
                                                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm w-full"
                                                    />
                                                </td>
                                                <td className="py-3">
                                                    <select
                                                        value={editingUser.sport}
                                                        onChange={(e) => setEditingUser({ ...editingUser, sport: e.target.value })}
                                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm w-full"
                                                    >
                                                        <option value="beach tennis">Beach Tennis</option>
                                                        <option value="tennis">Tennis</option>
                                                        <option value="pickleball">Pickleball</option>
                                                        <option value="padel">Padel</option>
                                                    </select>
                                                </td>
                                                <td className="py-3">
                                                    {/* Verification not editable here */}
                                                    <span className="text-gray-600 text-xs">--</span>
                                                </td>
                                                <td className="py-3">
                                                    <select
                                                        value={editingUser.role}
                                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm w-full"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={handleSave} className="p-1 text-green-400 hover:text-green-300">
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingUser(null)} className="p-1 text-red-400 hover:text-red-300">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="py-3 text-gray-300">{user.username}</td>
                                                <td className="py-3 text-white">{user.name}</td>
                                                <td className="py-3 text-gray-400">{user.email}</td>
                                                <td className="py-3 text-gray-300 capitalize">{user.sport}</td>
                                                <td className="py-3">
                                                    {user.is_verified ? (
                                                        <span className="text-green-400 text-xs border border-green-500/30 bg-green-500/10 px-2 py-1 rounded">Verified</span>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <span className="text-yellow-400 text-xs font-mono bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/30 w-fit">
                                                                Code: {user.verification_code}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 mt-1">Pending</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                                                        }`}>
                                                        {user.role || 'user'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/profile?username=${user.username}`)}
                                                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                            title="View Progress"
                                                        >
                                                            <Activity className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                                            title="Edit User"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        {user.username !== username && (
                                                            <button
                                                                onClick={() => handleDelete(user.username)}
                                                                className="p-2 text-red-400/50 hover:text-red-400 transition-colors"
                                                                title="Delete User"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
