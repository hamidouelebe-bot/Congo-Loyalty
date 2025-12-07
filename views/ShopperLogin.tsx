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
  
  // Forgot PIN state
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotStep, setForgotStep] = useState<'phone' | 'code' | 'newpin'>('phone');
  const [forgotPhone, setForgotPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

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

  // Forgot PIN handlers
  const handleSendResetCode = async () => {
    setForgotError('');
    setForgotLoading(true);
    
    try {
      const result = await api.auth.shopperForgotPin(forgotPhone);
      if (result.success) {
        setMaskedEmail(result.email || '');
        setForgotStep('code');
        setForgotSuccess(lang === 'fr' ? 'Code envoyé à votre email!' : 'Code sent to your email!');
      } else {
        setForgotError(result.error || (lang === 'fr' ? 'Erreur' : 'Error'));
      }
    } catch (error) {
      setForgotError(lang === 'fr' ? 'Erreur de connexion' : 'Connection error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPin = async () => {
    setForgotError('');
    
    if (newPin !== confirmNewPin) {
      setForgotError(lang === 'fr' ? 'Les codes PIN ne correspondent pas' : 'PINs do not match');
      return;
    }
    
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setForgotError(lang === 'fr' ? 'Le PIN doit être 4 chiffres' : 'PIN must be 4 digits');
      return;
    }

    setForgotLoading(true);
    
    try {
      const result = await api.auth.shopperResetPin(forgotPhone, resetCode, newPin);
      if (result.success) {
        setForgotSuccess(lang === 'fr' ? 'PIN réinitialisé! Vous pouvez vous connecter.' : 'PIN reset! You can now login.');
        setTimeout(() => {
          setShowForgotPin(false);
          resetForgotState();
        }, 2000);
      } else {
        setForgotError(result.error || (lang === 'fr' ? 'Code invalide' : 'Invalid code'));
      }
    } catch (error) {
      setForgotError(lang === 'fr' ? 'Erreur de connexion' : 'Connection error');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotState = () => {
    setForgotStep('phone');
    setForgotPhone('');
    setResetCode('');
    setNewPin('');
    setConfirmNewPin('');
    setForgotError('');
    setForgotSuccess('');
    setMaskedEmail('');
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
                  placeholder="XX XXX XXXX"
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
               <div className="text-right mt-1">
                 <button 
                   type="button"
                   onClick={() => setShowForgotPin(true)}
                   className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                 >
                   {lang === 'fr' ? 'Code PIN oublié?' : 'Forgot PIN?'}
                 </button>
               </div>
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

      {/* Forgot PIN Modal */}
      {showForgotPin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === 'fr' ? '🔐 Réinitialiser le PIN' : '🔐 Reset PIN'}
                </h3>
                <button 
                  onClick={() => { setShowForgotPin(false); resetForgotState(); }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {forgotError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {forgotError}
                </div>
              )}
              {forgotSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {forgotSuccess}
                </div>
              )}

              {/* Step 1: Enter Phone */}
              {forgotStep === 'phone' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {lang === 'fr' 
                      ? 'Entrez votre numéro de téléphone. Un code sera envoyé à votre email.' 
                      : 'Enter your phone number. A reset code will be sent to your email.'}
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      {lang === 'fr' ? 'Numéro de Téléphone' : 'Phone Number'}
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        +243
                      </span>
                      <input 
                        type="tel" 
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="XX XXX XXXX"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSendResetCode}
                    disabled={forgotLoading || !forgotPhone}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                  >
                    {forgotLoading 
                      ? (lang === 'fr' ? 'Envoi...' : 'Sending...') 
                      : (lang === 'fr' ? 'Envoyer le Code' : 'Send Reset Code')}
                  </button>
                </div>
              )}

              {/* Step 2: Enter Code */}
              {forgotStep === 'code' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {lang === 'fr' 
                      ? `Un code a été envoyé à ${maskedEmail}` 
                      : `A code was sent to ${maskedEmail}`}
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      {lang === 'fr' ? 'Code de Vérification' : 'Verification Code'}
                    </label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest font-bold text-xl"
                      placeholder="000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      {lang === 'fr' ? 'Nouveau PIN' : 'New PIN'}
                    </label>
                    <input 
                      type="password" 
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest font-bold text-lg"
                      placeholder="••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      {lang === 'fr' ? 'Confirmer le PIN' : 'Confirm PIN'}
                    </label>
                    <input 
                      type="password" 
                      maxLength={4}
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest font-bold text-lg"
                      placeholder="••••"
                    />
                  </div>
                  <button 
                    onClick={handleResetPin}
                    disabled={forgotLoading || !resetCode || !newPin || !confirmNewPin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                  >
                    {forgotLoading 
                      ? (lang === 'fr' ? 'Réinitialisation...' : 'Resetting...') 
                      : (lang === 'fr' ? 'Réinitialiser le PIN' : 'Reset PIN')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setForgotStep('phone')}
                    className="w-full text-gray-500 text-sm hover:text-gray-700"
                  >
                    {lang === 'fr' ? '← Retour' : '← Back'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopperLogin;
