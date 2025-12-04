
import React, { useState } from 'react';
import { MOCK_USERS, MOCK_RECEIPTS, TRANSLATIONS } from '../constants';
import { Language, UserStatus, AppView, UserSegment } from '../types';

interface UserDetailsProps {
  userId: string | null;
  lang: Language;
  onNavigate: (view: AppView) => void;
}

const UserDetails: React.FC<UserDetailsProps> = ({ userId, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];
  // Find the user or fallback to first if not found (dev safety)
  const initialUser = MOCK_USERS.find(u => u.id === userId) || MOCK_USERS[0];
  const [user, setUser] = useState(initialUser);

  const userReceipts = MOCK_RECEIPTS.filter(r => r.userId === user.id);

  const handleBan = () => {
    if (confirm(`Are you sure you want to ban ${user.firstName}?`)) {
      setUser({ ...user, status: UserStatus.Banned });
    }
  };

  const handleUnban = () => {
    setUser({ ...user, status: UserStatus.Active });
  };

  const handleSegmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSegment = e.target.value as UserSegment;
    // In a real app, this would make an API call to override the auto-calculation
    setUser({ ...user, segment: newSegment });
  };

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return 'N/A';
    const dob = new Date(birthdate);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <button 
        onClick={() => onNavigate(AppView.Users)}
        className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Users
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                 {user.firstName} {user.lastName}
                 {user.segment === 'VIP' && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-200">VIP</span>}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span>{user.email}</span>
                <span>•</span>
                <span>{user.phoneNumber}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             {user.status === UserStatus.Banned ? (
               <button 
                onClick={handleUnban}
                className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 Unban User
               </button>
             ) : (
               <button 
                onClick={handleBan}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
               >
                 Ban User
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-gray-100 bg-gray-50">
          <div className="p-6 text-center">
             <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Status</div>
             <div className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-bold capitalize ${
               user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
             }`}>
               {user.status}
             </div>
          </div>
          <div className="p-6 text-center">
             <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Points Balance</div>
             <div className="mt-1 text-2xl font-bold text-blue-600">{user.pointsBalance.toLocaleString()}</div>
          </div>
          <div className="p-6 text-center">
             <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Next Expiration</div>
             {user.pointsExpiring > 0 ? (
               <div className="mt-1">
                 <div className="text-xl font-bold text-orange-600">{user.pointsExpiring} pts</div>
                 <div className="text-xs text-gray-500">on {user.nextExpirationDate}</div>
               </div>
             ) : (
               <div className="mt-1 text-lg font-medium text-gray-400">None</div>
             )}
          </div>
          <div className="p-6 text-center">
             <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">Total Spent</div>
             <div className="mt-1 text-2xl font-bold text-gray-900">{user.totalSpent.toLocaleString()} CDF</div>
          </div>
        </div>

        {/* Classification Control */}
        <div className="px-8 py-6 border-b border-gray-100 bg-white">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide">Customer Classification</h3>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-500">Manual Override:</span>
                 <select 
                    value={user.segment || 'Regular'} 
                    onChange={handleSegmentChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                 >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="New">New</option>
                    <option value="ChurnRisk">Churn Risk</option>
                 </select>
              </div>
           </div>
           
           <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex gap-2 mb-2">
                 <span className="font-bold text-blue-900 text-sm">Automated Logic:</span>
              </div>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                 <li><strong>VIP:</strong> > 2,000 Points</li>
                 <li><strong>New:</strong> Joined within 30 days</li>
                 <li><strong>Churn Risk:</strong> 2+ Rejected receipts</li>
              </ul>
           </div>
        </div>

        {/* Demographics Section */}
        <div className="px-8 py-6 border-b border-gray-100 bg-white">
           <h3 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wide">Demographics</h3>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                 <span className="text-xs text-gray-500 block">Gender</span>
                 <span className="font-medium text-gray-900">{user.gender || 'Not specified'}</span>
              </div>
              <div>
                 <span className="text-xs text-gray-500 block">Age</span>
                 <span className="font-medium text-gray-900">
                    {calculateAge(user.birthdate)} years 
                    <span className="text-xs text-gray-400 font-normal ml-1">({user.birthdate || 'N/A'})</span>
                 </span>
              </div>
              <div>
                 <span className="text-xs text-gray-500 block">Member Since</span>
                 <span className="font-medium text-gray-900">{user.joinedDate}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h3 className="font-bold text-lg text-gray-900">Receipt History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userReceipts.length > 0 ? userReceipts.map(receipt => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                   <td className="px-6 py-4 text-sm text-gray-600">{receipt.date}</td>
                   <td className="px-6 py-4 font-medium text-gray-900">{receipt.supermarketName}</td>
                   <td className="px-6 py-4 text-sm font-mono text-gray-700">{receipt.amount.toLocaleString()} CDF</td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                       receipt.status === 'verified' ? 'bg-green-100 text-green-800' :
                       receipt.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                     }`}>
                       {receipt.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-xs text-gray-400">{receipt.id}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No receipts found for this user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
