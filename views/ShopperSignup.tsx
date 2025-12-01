
import React, { useState } from 'react';
import { AppView, Language, User, UserStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { db, isConfigured } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

interface ShopperSignupProps {
  onLogin: (user: User) => void;
  onNavigate: (view: AppView) => void;
  lang: Language;
}

const ShopperSignup: React.FC<ShopperSignupProps> = ({ onLogin, onNavigate, lang }) => {
  const t = TRANSLATIONS[lang].auth;
  
  // Steps: 'details' -> 'otp'
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pin: '',
    gender: '',
    birthdate: ''
  });

  const [otp, setOtp] = useState('');

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isConfigured) {
        // 1. Check if user already exists in DB
        const q = query(collection(db, 'users'), where('phoneNumber', '==', formData.phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          alert("This phone number is already registered. Please log in.");
          onNavigate(AppView.ShopperLogin);
          return;
        }
      } else {
        console.warn("Skipping Duplicate User Check (Demo Mode)");
      }

      // 2. Move to OTP step
      setStep('otp');
      
    } catch (error) {
      console.error("Signup Error:", error);
      setStep('otp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp !== '123456') {
      alert('Invalid OTP Code. Try 123456');
      setIsLoading(false);
      return;
    }

    try {
      // Create User Object
      const newUserBase: Omit<User, 'id'> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        status: UserStatus.Active,
        pointsBalance: 50, // Welcome Bonus
        pointsExpiring: 0,
        nextExpirationDate: null,
        pointsExpiresAt: null,
        totalSpent: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        birthdate: formData.birthdate,
        // @ts-ignore
        pin: formData.pin 
      };

      let finalUser: User;

      if (isConfigured) {
         const docRef = await addDoc(collection(db, 'users'), newUserBase);
         finalUser = { ...newUserBase, id: docRef.id } as User;
      } else {
         console.warn("Demo Mode: Simulating DB Write");
         await new Promise(r => setTimeout(r, 800));
         finalUser = { ...newUserBase, id: `demo-${Date.now()}` } as User;
      }
      
      alert("Account created successfully!");
      // Pass the new user to parent to login immediately
      onLogin(finalUser);

    } catch (error) {
      console.error("Error creating account:", error);
      alert("Error creating account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-48 bg-blue-600 rounded-b-[40px] z-0"></div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10 transition-all">
        {step === 'details' ? (
          <>
            <div className="p-8 pb-0 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✨</div>
              <h2 className="text-2xl font-bold text-gray-900">{t.signup_title}</h2>
              <p className="text-gray-500 text-sm mt-2">{t.signup_subtitle}</p>
            </div>
            
            <div className="p-8 pt-6">
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.first_name}</label>
                    <input 
                      type="text" 
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.last_name}</label>
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Kabeya"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.gender_label || 'Gender'}</label>
                      <select 
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-white"
                      >
                         <option value="">{t.select_gender || 'Select'}</option>
                         <option value="Male">{t.gender_male || 'Male'}</option>
                         <option value="Female">{t.gender_female || 'Female'}</option>
                         <option value="Other">{t.gender_other || 'Other'}</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.birthdate_label || 'Birthdate'}</label>
                      <input 
                        type="date" 
                        required
                        value={formData.birthdate}
                        onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.email_label}</label>
                   <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="jean@example.com"
                    />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t.phone_label}</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +243
                    </span>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                      value={formData.pin}
                      onChange={(e) => setFormData({...formData, pin: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center tracking-widest font-bold text-lg"
                      placeholder="••••"
                    />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center mt-2"
                >
                  {isLoading ? t.verifying : t.signup_btn}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-gray-100 pt-6">
                <p className="text-xs text-gray-400 mb-2">{t.have_account}</p>
                <button onClick={() => onNavigate(AppView.ShopperLogin)} className="text-sm font-bold text-blue-600 hover:text-blue-800">
                  {t.login_link}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* OTP STEP */
          <>
             <div className="p-8 pb-0 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📧</div>
              <h2 className="text-2xl font-bold text-gray-900">{t.otp_title}</h2>
              <p className="text-gray-500 text-sm mt-2 px-2">
                {t.otp_desc} <span className="font-bold text-gray-800">{formData.email}</span>
              </p>
            </div>

            <div className="p-8 pt-6">
               <form onSubmit={handleOtpVerify} className="space-y-6">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 text-center">{t.otp_label}</label>
                     <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center tracking-[0.5em] font-bold text-2xl"
                        placeholder={t.otp_placeholder}
                      />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading || otp.length < 6}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-200 flex justify-center items-center"
                  >
                    {isLoading ? t.creating_account : t.verify_btn}
                  </button>

                  <div className="text-center">
                    <button type="button" onClick={() => alert('Code resent!')} className="text-sm text-blue-600 font-medium hover:underline">
                      {t.resend_code}
                    </button>
                    <div className="mt-4">
                      <button type="button" onClick={() => setStep('details')} className="text-xs text-gray-400 hover:text-gray-600">
                        ← {t.back_home}
                      </button>
                    </div>
                  </div>
               </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopperSignup;
