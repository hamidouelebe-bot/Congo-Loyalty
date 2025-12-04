
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, MOCK_RECEIPTS } from '../constants';
import { User, UserStatus, Language, AppView, UserSegment } from '../types';

interface UsersProps {
  lang: Language;
  onNavigate: (view: AppView, id?: string) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Users: React.FC<UsersProps> = ({ lang, onNavigate, users, setUsers }) => {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');

  // Auto-Segmentation Logic
  useEffect(() => {
    // We update the local users state if we detect they don't have segments yet or if logic applies
    // Note: In a real app this runs on backend. Here we simulate it on view load.
    
    const updatedUsers = users.map(user => {
       // If manually set (e.g. from UserDetails), keep it? 
       // For this requirement, we re-calculate unless it's strictly set. 
       // We'll calculate a 'suggested' segment.
       
       let calculatedSegment: UserSegment = 'Regular';
       
       // 1. Churn Risk Logic: > 2 Rejected/Low Confidence Receipts
       const userReceipts = MOCK_RECEIPTS.filter(r => r.userId === user.id);
       const riskyReceipts = userReceipts.filter(r => r.status === 'rejected' || r.confidenceScore < 0.5).length;
       if (riskyReceipts >= 2) {
          calculatedSegment = 'ChurnRisk';
       } 
       // 2. VIP Logic: > 2000 Points
       else if (user.pointsBalance > 2000) {
          calculatedSegment = 'VIP';
       }
       // 3. New User Logic: Joined < 30 days ago
       else {
          const joinDate = new Date(user.joinedDate);
          const diffTime = Math.abs(Date.now() - joinDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if (diffDays <= 30) {
             calculatedSegment = 'New';
          }
       }
       
       // Apply if not set (or we can overwrite to enforce auto-rules)
       // Let's only apply if 'segment' is missing to allow manual overrides from UserDetails to stick
       if (!user.segment) {
          return { ...user, segment: calculatedSegment };
       }
       return user;
    });

    // Only set if different to avoid infinite loop
    const hasChanged = JSON.stringify(updatedUsers) !== JSON.stringify(users);
    if (hasChanged) {
       setUsers(updatedUsers);
    }
  }, [users.length]); // Run when user count changes

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.Active: return 'bg-green-100 text-green-800';
      case UserStatus.Banned: return 'bg-red-100 text-red-800';
      case UserStatus.Suspended: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSegmentBadge = (segment?: UserSegment) => {
    switch(segment) {
       case 'VIP': 
         return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded border border-yellow-200 font-bold">VIP 👑</span>;
       case 'New':
         return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded border border-blue-200 font-bold">New ✨</span>;
       case 'ChurnRisk':
         return <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded border border-red-200 font-bold">Risk ⚠️</span>;
       default:
         return <span className="bg-gray-50 text-gray-500 text-xs px-2 py-0.5 rounded border border-gray-200">Regular</span>;
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
              <th className="px-6 py-4">Segment</th>
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
                  {getSegmentBadge(user.segment)}
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
