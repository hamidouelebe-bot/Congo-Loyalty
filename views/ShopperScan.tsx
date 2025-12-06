import React, { useState, useRef, useEffect } from 'react';
import { AppView, Language } from '../types';
import { IconCamera } from '../components/Icons';
import { analyzeReceiptImage, ScannedReceiptData } from '../services/geminiService';

interface ShopperScanProps {
  onNavigate: (view: AppView) => void;
  lang: Language;
}

const ShopperScan: React.FC<ShopperScanProps> = ({ onNavigate, lang }) => {
  // State
  const [image, setImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setIsCameraActive(true);
    try {
      let stream: MediaStream;
      try {
        // First try requesting the rear camera (best for receipts)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } } 
        });
      } catch (e) {
        // Fallback to any available camera (laptops/webcams)
        console.log("Environment camera request failed, trying default...", e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImage(dataUrl);
        stopCamera();
        processImage(dataUrl);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl);
        processImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64Img: string) => {
    setIsProcessing(true);
    setScannedData(null);
    setError(null);

    try {
      // Call Gemini Service
      const result = await analyzeReceiptImage(base64Img);
      if (result && result.confidence > 0.4) {
        setScannedData(result);
      } else {
        setError("Reçu non lisible. Veuillez réessayer avec une meilleure lumière.");
      }
    } catch (e) {
      setError("Erreur d'analyse IA. Vérifiez votre connexion.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    // In a real app, save 'scannedData' to Firestore here
    alert("Reçu validé et envoyé !");
    onNavigate(AppView.ShopperDashboard);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- RENDER ---

  // 1. SUCCESS VIEW
  if (scannedData && !isProcessing) {
     return (
       <div className="min-h-screen bg-gray-50 flex flex-col p-6 animate-in fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Vérification du Reçu</h2>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
             <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                <div>
                   <label className="text-xs text-gray-500 uppercase font-bold">Magasin</label>
                   <div className="text-lg font-bold text-gray-900">{scannedData.merchantName}</div>
                </div>
                <div className="text-right">
                   <label className="text-xs text-gray-500 uppercase font-bold">Date</label>
                   <div className="text-sm font-medium">{scannedData.date}</div>
                </div>
             </div>
             
             <div className="space-y-3 mb-4">
                <label className="text-xs text-gray-500 uppercase font-bold">Articles détectés</label>
                {scannedData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                     <span className="text-gray-700">{item.quantity}x {item.name}</span>
                     <span className="font-medium">{item.price}</span>
                  </div>
                ))}
             </div>
             
             <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                <span className="text-blue-900 font-bold">Total</span>
                <span className="text-blue-600 font-extrabold text-xl">{scannedData.totalAmount} {scannedData.currency}</span>
             </div>
          </div>

          <div className="flex gap-4">
             <button 
               onClick={() => { setImage(null); setScannedData(null); }}
               className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl"
             >
               Rejeter
             </button>
             <button 
               onClick={handleConfirm}
               className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg"
             >
               Valider
             </button>
          </div>
       </div>
     );
  }

  // 2. CAMERA VIEW
  if (isCameraActive) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
         <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="flex-1 w-full h-full object-cover"
         />
         <canvas ref={canvasRef} className="hidden" />
         
         <div className="absolute top-0 w-full p-6 flex justify-between items-center">
            <button onClick={stopCamera} className="bg-black/40 text-white p-2 rounded-full backdrop-blur-sm">
               ✕
            </button>
         </div>

         <div className="bg-black/80 p-8 flex justify-center items-center pb-12">
            <button 
              onClick={captureImage}
              className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-xl active:scale-95 transition-transform"
            ></button>
         </div>
      </div>
    );
  }

  // 3. MAIN/PREVIEW VIEW
  return (
    <div className="min-h-screen bg-black flex flex-col relative">
       {/* Header */}
       <div className="absolute top-0 w-full p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={() => onNavigate(AppView.ShopperDashboard)} className="text-white p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-white font-medium">Scanner Intelligent</span>
          <div className="w-8"></div>
       </div>

       {/* Viewport */}
       <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
          {image ? (
            <div className="relative w-full h-full">
               <img src={image} alt="Preview" className="w-full h-full object-contain opacity-50" />
               {isProcessing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-bold text-lg animate-pulse">Analyse Gemini en cours...</p>
                 </div>
               )}
            </div>
          ) : (
            <div className="text-center p-8">
               <div className="w-64 h-80 border-2 border-dashed border-white/50 rounded-2xl mx-auto flex items-center justify-center mb-4 relative">
                  <span className="text-white/50 text-sm">Alignez le ticket</span>
               </div>
               {error && (
                 <div className="bg-red-500/80 text-white p-3 rounded-lg text-sm max-w-xs mx-auto mb-4">
                   {error}
                 </div>
               )}
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
       </div>

       {/* Controls */}
       {!isProcessing && (
         <div className="bg-black p-8 pb-12 flex flex-col items-center justify-center gap-6">
            {image ? (
               <button 
                 onClick={() => { setImage(null); setError(null); }}
                 className="bg-gray-800 text-white font-medium py-3 px-8 rounded-xl"
               >
                 Reprendre
               </button>
            ) : (
               <div className="flex gap-6 items-center">
                  <button onClick={triggerFileInput} className="flex flex-col items-center gap-2 text-white/70 hover:text-white">
                     <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                     </div>
                     <span className="text-xs">Galerie</span>
                  </button>

                  <button 
                    onClick={startCamera}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/30 transition-all active:scale-95"
                  >
                     <div className="w-16 h-16 bg-white rounded-full"></div>
                  </button>

                  <div className="w-12"></div> {/* Spacer balance */}
               </div>
            )}
         </div>
       )}
    </div>
  );
};

export default ShopperScan;
