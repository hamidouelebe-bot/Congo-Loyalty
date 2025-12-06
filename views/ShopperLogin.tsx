import React, { useState } from 'react';
import { AppView, Language, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { api } from '../services/api';

interface ShopperLoginProps {
  onLogin: (user: User) => void;
  onNavigate: (view: AppView) => void;
  lang: Language;
}

const ShopperLogin: React.FC<ShopperLoginProps> = ({ onLogin, onNavigate, lang }) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = TRANSLATIONS[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.auth.shopperLogin(phone, pin);
      
      if (response.success && response.user) {
        onLogin(response.user);
      } else {
        alert(response.error || "Login Failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login Error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 rounded-b-[40px] z-0"></div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10">
        <div className="p-8 pb-0 text-center">
           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🛍️</div>
           <h2 className="text-2xl font-bold text-gray-900">{t.shopper_login_title}</h2>
           <p className="text-gray-500 text-sm mt-2">{t.shopper_login_desc}</p>
        </div>
        
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLoading && (
               <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mb-2 text-center">
                 Demo Mode Active. Use: <strong>81 123 4567</strong> / <strong>1234</strong>
               </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.phone_label}</label>
              <div className="flex">
                 <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                   +243
                 </span>
                 <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="81 123 4567"
                />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.pin_code}</label>
               <input 
                  type="password" 
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center tracking-widest font-bold text-lg"
                  placeholder="••••"
                />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center mt-2"
            >
              {isLoading ? t.verifying : t.login_btn}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 mb-2">{t.not_client}</p>
            <button onClick={() => onNavigate(AppView.ShopperSignup)} className="text-sm font-bold text-blue-600 hover:text-blue-800">
              {t.create_account}
            </button>
            <div className="mt-4 pt-4 border-t border-gray-100">
               <button onClick={() => onNavigate(AppView.Login)} className="text-xs text-gray-400 hover:text-gray-600">
                  {t.partner_link}
               </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 z-10">
         <button onClick={() => onNavigate(AppView.Landing)} className="text-gray-500 text-sm hover:text-gray-800">{t.back_website}</button>
      </div>
    </div>
  );
};

export default ShopperLogin;
