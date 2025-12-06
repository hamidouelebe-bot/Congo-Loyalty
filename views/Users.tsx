import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { User, UserStatus, Language, AppView, UserSegment } from '../types';
import { api } from '../services/api';

interface UsersProps {
  lang: Language;
  onNavigate: (view: AppView, id?: string) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Users: React.FC<UsersProps> = ({ lang, onNavigate, users, setUsers }) => {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    pin: '',
    gender: '',
    birthdate: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.users.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.pin) {
      setError(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields');
      return;
    }

    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      setError(lang === 'fr' ? 'Le PIN doit être composé de 4 chiffres' : 'PIN must be 4 digits');
      return;
    }

    try {
      const newUser = await api.users.create(formData);
      setUsers([newUser, ...users]);
      setIsModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', pin: '', gender: '', birthdate: '' });
      setSuccessMessage(lang === 'fr' ? 'Utilisateur créé avec succès' : 'User created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet utilisateur?' : 'Are you sure you want to delete this user?')) return;
    
    try {
      await api.users.delete(id);
      setUsers(users.filter(u => u.id !== id));
      setSuccessMessage(lang === 'fr' ? 'Utilisateur supprimé' : 'User deleted');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
    }
  };

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

  const handleBan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm(lang === 'fr' ? 'Êtes-vous sûr de vouloir bannir cet utilisateur?' : 'Are you sure you want to ban this user?')) {
      try {
        await api.users.updateStatus(id, UserStatus.Banned);
        setUsers(users.map(u => u.id === id ? { ...u, status: UserStatus.Banned } : u));
      } catch (err) {
        console.error('Failed to ban user:', err);
        setError('Failed to ban user');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(search.toLowerCase()) || 
    u.lastName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && !isModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">{t.users}</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder={lang === 'fr' ? 'Rechercher...' : 'Search users...'} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:w-64"
            />
            <button
              onClick={() => { setIsModalOpen(true); setError(''); }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {lang === 'fr' ? 'Ajouter' : 'Add User'}
            </button>
          </div>
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
                    onClick={() => onNavigate(AppView.UserDetails, user.id)}
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
                  <button 
                    onClick={(e) => handleDeleteUser(user.id, e)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors ml-2"
                    title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                  >
                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {lang === 'fr' ? 'Nouvel Utilisateur' : 'New User'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'fr' ? 'Prénom' : 'First Name'} *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'fr' ? 'Nom' : 'Last Name'} *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'fr' ? 'Téléphone' : 'Phone'} *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +243
                    </span>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="XX XXX XXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN (4 {lang === 'fr' ? 'chiffres' : 'digits'}) *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'fr' ? 'Genre' : 'Gender'}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{lang === 'fr' ? 'Sélectionner' : 'Select'}</option>
                    <option value="male">{lang === 'fr' ? 'Homme' : 'Male'}</option>
                    <option value="female">{lang === 'fr' ? 'Femme' : 'Female'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'fr' ? 'Date de naissance' : 'Birthdate'}
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {lang === 'fr' ? 'Créer' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
