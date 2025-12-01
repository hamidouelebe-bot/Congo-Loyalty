
import React from 'react';
import { AppView, ContentPage, Language } from '../types';

interface ShopperStaticPageProps {
  onNavigate: (view: AppView) => void;
  pageData: ContentPage;
  lang: Language;
}

const ShopperStaticPage: React.FC<ShopperStaticPageProps> = ({ onNavigate, pageData, lang }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-gray-100 flex items-center gap-4">
        <button 
          onClick={() => onNavigate(AppView.ShopperProfile)}
          className="text-gray-500 hover:text-gray-900"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 truncate">{pageData.title}</h1>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 prose prose-blue max-w-none">
          {pageData.content.split('\n').map((paragraph, idx) => (
             <p key={idx} className={`text-gray-700 ${paragraph.trim() === '' ? 'h-4' : 'mb-4'}`}>
               {paragraph}
             </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopperStaticPage;
