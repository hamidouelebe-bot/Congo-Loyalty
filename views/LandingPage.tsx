
import React, { useState } from 'react';
import { AppView, Language, LandingContent } from '../types';
import { TRANSLATIONS } from '../constants';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  content: LandingContent;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, lang, setLang, content }) => {
  const t = TRANSLATIONS[lang].landing;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 relative">
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
           <div className="px-6 py-6 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white font-bold text-xl px-2 py-1 rounded">DRC</span>
                <span className="text-xl font-bold text-blue-900">{content.appName || 'Loyalty'}</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-gray-900 p-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
           </div>
           <div className="p-6 flex flex-col gap-6 text-lg">
              <div className="flex gap-4">
                 <button 
                    onClick={() => { setLang('en'); setIsMenuOpen(false); }} 
                    className={`flex-1 px-4 py-3 rounded-xl border text-center font-medium transition-colors ${lang === 'en' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600'}`}
                 >
                    English
                 </button>
                 <button 
                    onClick={() => { setLang('fr'); setIsMenuOpen(false); }} 
                    className={`flex-1 px-4 py-3 rounded-xl border text-center font-medium transition-colors ${lang === 'fr' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600'}`}
                 >
                    Français
                 </button>
              </div>
              <hr className="border-gray-100" />
              <button 
                onClick={() => { onNavigate(AppView.ShopperLogin); setIsMenuOpen(false); }}
                className="text-left font-bold text-gray-900 py-2 hover:text-blue-600"
              >
                {t.nav_shopper}
              </button>
              <button 
                onClick={() => { onNavigate(AppView.PartnerLogin); setIsMenuOpen(false); }}
                className="text-left font-bold text-gray-900 py-2 hover:text-emerald-600"
              >
                Partner Portal
              </button>
              <button 
                onClick={() => { onNavigate(AppView.Login); setIsMenuOpen(false); }}
                className="text-left font-bold text-gray-900 py-2 hover:text-blue-600"
              >
                {t.nav_partner}
              </button>
           </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-40">
        <div className="flex items-center gap-2">
           <span className="bg-blue-600 text-white font-bold text-xl px-2 py-1 rounded">DRC</span>
           <span className="text-xl font-bold text-blue-900">{content.appName || 'Loyalty'}</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${lang === 'en' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('fr')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${lang === 'fr' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                FR
              </button>
          </div>
          <button 
            onClick={() => onNavigate(AppView.ShopperLogin)}
            className="text-gray-600 hover:text-blue-600 font-medium px-2 py-2 transition-colors text-sm"
          >
            {t.nav_shopper}
          </button>
          <button 
            onClick={() => onNavigate(AppView.PartnerLogin)}
            className="text-emerald-600 hover:text-emerald-700 font-medium px-2 py-2 transition-colors text-sm"
          >
            Partner Portal
          </button>
          <button 
            onClick={() => onNavigate(AppView.Login)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg text-sm"
          >
            {t.nav_partner}
          </button>
        </div>

        {/* Mobile Hamburger Trigger */}
        <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-gray-600 p-2 hover:text-blue-600 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </nav>

      {/* Hero Section */}
      <header className="max-w-4xl mx-auto px-6 py-20 lg:py-32 text-center space-y-8">
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
          {content.heroTitle1}<span className="text-blue-600">{content.heroTitle2}</span>{content.heroTitle3}
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          {content.heroDesc}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
           <button 
             onClick={() => onNavigate(AppView.ShopperLogin)}
             className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
             {content.btnDownload}
           </button>
        </div>
      </header>

      {/* Text Block Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-12">
           <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{content.whyTitle}</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                 {content.whyDesc}
              </p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-4">📸</div>
                 <h3 className="font-bold text-lg mb-2">{content.featScanTitle}</h3>
                 <p className="text-gray-600 text-sm">{content.featScanDesc}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                 <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-4">🎁</div>
                 <h3 className="font-bold text-lg mb-2">{content.featRewardsTitle}</h3>
                 <p className="text-gray-600 text-sm">{content.featRewardsDesc}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-4">🛡️</div>
                 <h3 className="font-bold text-lg mb-2">{content.featSecureTitle}</h3>
                 <p className="text-gray-600 text-sm">{content.featSecureDesc}</p>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
           <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-sm">DRC</span>
              <span className="font-bold text-xl">{content.appName || 'Loyalty'}</span>
           </div>
           <div className="flex gap-6 text-sm text-gray-400">
              <button onClick={() => onNavigate(AppView.ShopperTerms)} className="hover:text-white">{t.footer_terms}</button>
              <button onClick={() => onNavigate(AppView.ShopperPrivacy)} className="hover:text-white">{t.footer_privacy}</button>
              <button onClick={() => onNavigate(AppView.ShopperHelp)} className="hover:text-white">{t.footer_help}</button>
           </div>
           <p className="text-gray-500 text-sm mt-4">{content.footerCopy}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
