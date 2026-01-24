import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * UserManagement Component
 * Shows user list with stats and management controls
 */
export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [search, roleFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);
            params.append('limit', '20');

            const res = await axios.get(`${API_URL}/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.data.users || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-fuchsia-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-xl">
                            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                            <p className="text-sm text-gray-500">{users.length} users</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent w-40"
                        />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                            <option value="">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="p-6">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-sm">No users found</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {users.map(user => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                                        {user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}
                                    </div>
                                    {/* Info */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{user.fullName || user.username}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'admin'
                                                    ? 'bg-violet-100 text-violet-700'
                                                    : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatCurrency(user.balance)}</p>
                                        <p className="text-xs text-gray-400">Balance</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{user.holdingCount}</p>
                                        <p className="text-xs text-gray-400">Holdings</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{user.transactionCount}</p>
                                        <p className="text-xs text-gray-400">Transactions</p>
                                    </div>
                                    <div className="text-right hidden lg:block">
                                        <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
                                        <p className="text-xs text-gray-400">Joined</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
