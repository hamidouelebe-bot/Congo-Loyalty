import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { IconBrain } from '../components/Icons';
import { api } from '../services/api';

interface AIAnalysisProps {
  lang: Language;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResponse(null);

    try {
      const data = await api.ai.analyze(prompt);
      setResponse(data.result);
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setResponse(lang === 'fr' 
        ? "Désolé, je n'ai pas pu analyser les données pour le moment. Veuillez réessayer." 
        : "Sorry, I couldn't analyze the data at this moment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <IconBrain className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">{t.ask_ai}</h2>
          </div>
          <p className="text-purple-100 max-w-2xl">
            Leverage Google's Gemini 2.0 Flash model to uncover deep insights about partner performance, campaign ROI, and user behavior trends in real-time.
          </p>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.ai_placeholder}
                  className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-32 text-gray-800 placeholder-gray-400"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !prompt.trim()}
                  className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-md
                    ${loading || !prompt.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'}
                  `}
                >
                  {loading ? t.thinking : t.analyze}
                </button>
             </div>
          </div>
          
          <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
             {response ? (
               <div className="prose prose-purple max-w-none bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                    <IconBrain className="w-5 h-5 text-purple-600" /> 
                    Analysis Result
                  </h3>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {response}
                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <IconBrain className="w-16 h-16 mb-4" />
                  <p>Results will appear here</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default AIAnalysis;