
import React, { useState, useEffect } from 'react';
import { AppContent, Language, LandingContent } from '../types';

interface AdminContentProps {
  content: AppContent;
  onUpdateContent: (newContent: AppContent) => void;
  lang: Language;
}

const AdminContent: React.FC<AdminContentProps> = ({ content, onUpdateContent, lang }) => {
  const [selectedPage, setSelectedPage] = useState<'landing' | 'help' | 'privacy' | 'terms'>('landing');
  const [isSaved, setIsSaved] = useState(false);
  
  // State for content pages
  const [pageData, setPageData] = useState({ title: '', body: '' });

  // State for Landing Page
  const [landingData, setLandingData] = useState<LandingContent>(content.landing);

  // Load content when selection changes
  useEffect(() => {
    if (selectedPage === 'landing') {
      setLandingData(content.landing);
    } else {
      setPageData({
        title: content[selectedPage].title,
        body: content[selectedPage].content
      });
    }
    setIsSaved(false);
  }, [selectedPage, content]);

  const handleSave = () => {
    let updatedContent = { ...content };

    if (selectedPage === 'landing') {
      updatedContent.landing = landingData;
    } else {
      updatedContent[selectedPage] = {
        title: pageData.title,
        content: pageData.body
      };
    }

    onUpdateContent(updatedContent);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const renderLandingEditor = () => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      <div className="border-b border-gray-100 pb-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-4">Global Branding</h3>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">App Name (Navbar & Footer)</label>
          <input
            type="text"
            value={landingData.appName}
            onChange={(e) => setLandingData({ ...landingData, appName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="border-b border-gray-100 pb-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-4">Hero Section</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title Part 1 (Black)</label>
            <input
              type="text"
              value={landingData.heroTitle1}
              onChange={(e) => setLandingData({ ...landingData, heroTitle1: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-500 uppercase mb-1">Title Part 2 (Blue)</label>
            <input
              type="text"
              value={landingData.heroTitle2}
              onChange={(e) => setLandingData({ ...landingData, heroTitle2: e.target.value })}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
           <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title Part 3 (Black)</label>
            <input
              type="text"
              value={landingData.heroTitle3}
              onChange={(e) => setLandingData({ ...landingData, heroTitle3: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hero Description</label>
          <textarea
            value={landingData.heroDesc}
            onChange={(e) => setLandingData({ ...landingData, heroDesc: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Button Text</label>
          <input
            type="text"
            value={landingData.btnDownload}
            onChange={(e) => setLandingData({ ...landingData, btnDownload: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="border-b border-gray-100 pb-4 mb-4">
         <h3 className="font-bold text-gray-800 mb-4">Value Proposition Section</h3>
         <div className="mb-3">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section Title</label>
            <input
              type="text"
              value={landingData.whyTitle}
              onChange={(e) => setLandingData({ ...landingData, whyTitle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
         </div>
         <div className="mb-3">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section Description</label>
            <textarea
              value={landingData.whyDesc}
              onChange={(e) => setLandingData({ ...landingData, whyDesc: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20"
            />
         </div>
      </div>

      <div className="border-b border-gray-100 pb-4 mb-4">
         <h3 className="font-bold text-gray-800 mb-4">Feature Cards</h3>
         {/* Feature 1 */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-lg">
            <div className="md:col-span-2 text-xs font-bold text-gray-400 uppercase">Feature 1 (Scan)</div>
            <div>
               <input
                type="text"
                placeholder="Title"
                value={landingData.featScanTitle}
                onChange={(e) => setLandingData({ ...landingData, featScanTitle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
               <input
                type="text"
                placeholder="Description"
                value={landingData.featScanDesc}
                onChange={(e) => setLandingData({ ...landingData, featScanDesc: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
         </div>
          {/* Feature 2 */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-lg">
            <div className="md:col-span-2 text-xs font-bold text-gray-400 uppercase">Feature 2 (Rewards)</div>
            <div>
               <input
                type="text"
                placeholder="Title"
                value={landingData.featRewardsTitle}
                onChange={(e) => setLandingData({ ...landingData, featRewardsTitle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
               <input
                type="text"
                placeholder="Description"
                value={landingData.featRewardsDesc}
                onChange={(e) => setLandingData({ ...landingData, featRewardsDesc: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
         </div>
         {/* Feature 3 */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-lg">
            <div className="md:col-span-2 text-xs font-bold text-gray-400 uppercase">Feature 3 (Security)</div>
            <div>
               <input
                type="text"
                placeholder="Title"
                value={landingData.featSecureTitle}
                onChange={(e) => setLandingData({ ...landingData, featSecureTitle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
               <input
                type="text"
                placeholder="Description"
                value={landingData.featSecureDesc}
                onChange={(e) => setLandingData({ ...landingData, featSecureDesc: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
         </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-800 mb-4">Footer</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Terms Link Title</label>
            <input
              type="text"
              value={landingData.footerTermsTitle || ''}
              onChange={(e) => setLandingData({ ...landingData, footerTermsTitle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Terms"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Privacy Link Title</label>
            <input
              type="text"
              value={landingData.footerPrivacyTitle || ''}
              onChange={(e) => setLandingData({ ...landingData, footerPrivacyTitle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Privacy"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Help Link Title</label>
            <input
              type="text"
              value={landingData.footerHelpTitle || ''}
              onChange={(e) => setLandingData({ ...landingData, footerHelpTitle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Help"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Copyright Text</label>
          <input
            type="text"
            value={landingData.footerCopy}
            onChange={(e) => setLandingData({ ...landingData, footerCopy: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );

  const renderContentPageEditor = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la Page</label>
        <input
          type="text"
          value={pageData.title}
          onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contenu (Texte)</label>
        <textarea
          value={pageData.body}
          onChange={(e) => setPageData({ ...pageData, body: e.target.value })}
          className="w-full h-96 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
          placeholder="Entrez le contenu ici..."
        />
        <p className="text-xs text-gray-500 mt-2">Vous pouvez utiliser des sauts de ligne pour formater le texte.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">Gestion du Contenu</h2>
        {isSaved && (
          <span className="text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full animate-pulse text-sm">
            ✓ Enregistré
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar for Page Selection */}
        <div className="w-full lg:w-64 space-y-2 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            <button
              onClick={() => setSelectedPage('landing')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-2 ${selectedPage === 'landing' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Landing Page (Accueil)
            </button>
            <div className="border-t border-gray-100 my-2"></div>
            <button
              onClick={() => setSelectedPage('help')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedPage === 'help' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Aide & Support
            </button>
            <button
              onClick={() => setSelectedPage('privacy')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedPage === 'privacy' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Politique de Confidentialité
            </button>
            <button
              onClick={() => setSelectedPage('terms')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedPage === 'terms' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Conditions d'Utilisation
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2">
            {selectedPage === 'landing' ? renderLandingEditor() : renderContentPageEditor()}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end shrink-0 mt-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
