
import React, { useState } from 'react';
import { AppView, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isConfigured } from '../firebaseConfig';

interface LoginProps {
  onLogin: () => void;
  onNavigate: (view: AppView) => void;
  lang: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate, lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = TRANSLATIONS[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 1. Check for Demo/Fallback Mode first
    if (!isConfigured) {
      console.warn("Firebase not configured. Attempting Demo Login.");
      if (email === 'admin@drcloyalty.com' && password === 'admin123') {
        setTimeout(() => {
          onLogin();
          setIsLoading(false);
        }, 1000);
        return;
      }
    }

    try {
      // 2. Try Real Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      console.error("Login Error:", err);
      
      // FALLBACK: If API key is invalid, allow demo login anyway
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
         if (email === 'admin@drcloyalty.com' && password === 'admin123') {
            console.log("Falling back to demo login due to missing config.");
            onLogin();
            return;
         }
         setError("Configuration Error: Missing API Key. Demo login allowed for: admin@drcloyalty.com / admin123");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Email ou mot de passe incorrect.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Trop de tentatives. Veuillez réessayer plus tard.");
      } else {
        setError("Erreur de connexion (" + err.code + ")");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
           <h2 className="text-3xl font-bold text-white mb-2">{t.welcome_back}</h2>
           <p className="text-blue-100">{t.sign_in_subtitle}</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!isConfigured && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-xs mb-4">
                <strong>Demo Mode:</strong> Firebase not configured.<br/>
                Use: <code>admin@drcloyalty.com</code> / <code>admin123</code>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.email_label}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="admin@drcloyalty.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.password_label}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-md flex justify-center items-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : t.sign_in_btn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => onNavigate(AppView.Landing)} className="text-sm text-gray-500 hover:text-blue-600">
              {t.back_home}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
