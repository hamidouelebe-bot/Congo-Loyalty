
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { User, UserStatus, Language, AppView } from '../types';

interface UsersProps {
  lang: Language;
  onNavigate: (view: AppView, id?: string) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Users: React.FC<UsersProps> = ({ lang, onNavigate, users, setUsers }) => {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.Active: return 'bg-green-100 text-green-800';
      case UserStatus.Banned: return 'bg-red-100 text-red-800';
      case UserStatus.Suspended: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to ban this user?')) {
      setUsers(users.map(u => u.id === id ? { ...u, status: UserStatus.Banned } : u));
    }
  };

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(search.toLowerCase()) || 
    u.lastName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">{t.users}</h2>
        <input 
          type="text" 
          placeholder="Search users..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Points</th>
              <th className="px-6 py-4">{t.status}</th>
              <th className="px-6 py-4 text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onNavigate(AppView.UserDetails, user.id)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-gray-500">ID: {user.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-400">{user.phoneNumber}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.joinedDate}</td>
                <td className="px-6 py-4 text-right font-medium text-blue-600">{user.pointsBalance}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    {t.view_details}
                  </button>
                  {user.status === UserStatus.Active && (
                    <button 
                      onClick={(e) => handleBan(user.id, e)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      {t.ban_user}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
