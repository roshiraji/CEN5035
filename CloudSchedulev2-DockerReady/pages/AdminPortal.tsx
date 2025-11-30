import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { getAllUsers, deleteUser, resetUserPassword } from '../services/api';
import toast from 'react-hot-toast';
import { Trash2, Key, RefreshCw, Shield, User as UserIcon } from 'lucide-react';

export const AdminPortal: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResetting, setIsResetting] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u.userId !== userId));
            toast.success('User deleted successfully');
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleResetPassword = async (userId: string) => {
        const newPassword = window.prompt('Enter new password:');
        if (!newPassword) return;

        setIsResetting(userId);
        try {
            await resetUserPassword(userId, newPassword);
            toast.success('Password reset successfully');
        } catch (error) {
            toast.error('Failed to reset password');
        } finally {
            setIsResetting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Admin Portal
                </h1>
                <p className="text-gray-500 mt-2">Manage users and system settings</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">System Users</h2>
                    <button
                        onClick={fetchUsers}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Refresh list"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                                    {u.displayName.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{u.displayName}</div>
                                                <div className="text-xs text-gray-500">ID: {u.userId.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                                                u.role === UserRole.INSTRUCTOR ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {u.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => handleResetPassword(u.userId)}
                                                disabled={isResetting === u.userId}
                                                className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 transition-colors"
                                                title="Reset Password"
                                            >
                                                <Key className={`w-5 h-5 ${isResetting === u.userId ? 'animate-pulse' : ''}`} />
                                            </button>
                                            {u.userId !== user?.userId && (
                                                <button
                                                    onClick={() => handleDeleteUser(u.userId)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
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
