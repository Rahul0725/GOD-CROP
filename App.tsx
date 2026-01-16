
import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Download, 
  Grid, 
  Shapes, 
  Maximize, 
  Zap, 
  Menu, 
  Droplets, 
  Layers, 
  Image as ImageIcon, 
  RefreshCw, 
  Sparkles, 
  Plus, 
  ArrowLeft,
  X,
  Palette
} from 'lucide-react';
import { ImageFile, CropState, ShapeType, ExportConfig, WatermarkState, ShapeConfig } from './types';
import { ASPECT_RATIOS } from './constants';
import ImageEditor from './components/ImageEditor';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ratio' | 'shape' | 'ai' | 'watermark' | 'export' | 'library' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [cropState, setCropState] = useState<CropState>({
    x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1, aspectRatio: 1,
    shape: 'square', cornerRadius: 12,
    shapeConfig: { sides: 5, points: 5, innerRadius: 0.5, seed: Math.random(), complexity: 8 }
  });

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'image/jpeg', quality: 0.9, keepMetadata: true
  });

  const [watermark, setWatermark] = useState<WatermarkState>({
    enabled: false, type: 'text', text: 'GOD CROP', opacity: 0.5, scale: 1, position: 'bottom-right'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      originalWidth: 0,
      originalHeight: 0
    }));
    setImages(prev => [...prev, ...newImages]);
    if (selectedIndex === null) setSelectedIndex(images.length);
  };

  const handleSmartCrop = async () => {
    if (selectedIndex === null) return;
    setIsProcessing(true);
    try {
      const currentImage = images[selectedIndex];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const reader = new FileReader();
      reader.readAsDataURL(currentImage.file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: currentImage.file.type } },
              { text: "Return the [ymin, xmin, ymax, xmax] coordinates of the main subject of this image in normalized values (0 to 1000). Use JSON format." }
            ]
          },
          config: { responseMimeType: "application/json" }
        });
        const coords = JSON.parse(response.text);
        if (Array.isArray(coords)) {
          const [ymin, xmin, ymax, xmax] = coords;
          setCropState(prev => ({
            ...prev, x: xmin / 1000, y: ymin / 1000, width: (xmax - xmin) / 1000, height: (ymax - ymin) / 1000
          }));
        }
      };
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateShapeConfig = (updates: Partial<ShapeConfig>) => {
    setCropState(prev => ({ ...prev, shapeConfig: { ...prev.shapeConfig, ...updates } }));
  };

  return (
    <div className="flex flex-col h-screen bg-black text-[#f5f5f5] overflow-hidden select-none safe-top safe-bottom">
      {/* Lightroom Top Bar */}
      <header className="px-6 h-14 flex items-center justify-between z-[100] border-b border-white/5 bg-black">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-[#888] hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Master Editor</span>
        </div>
        <div className="flex items-center gap-3">
          {images.length > 0 && (
            <button 
              onClick={() => setActiveTab('export')} 
              className="px-5 py-1.5 bg-blue-600 rounded-full font-bold text-[10px] uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              Export
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden" onClick={() => setActiveTab(null)}>
        {images.length > 0 && selectedIndex !== null ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 pb-48">
            <ImageEditor 
              image={images[selectedIndex]} 
              cropState={cropState}
              onCropChange={setCropState}
              watermark={watermark}
              isProcessing={isProcessing}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10 text-center px-10 animate-in fade-in duration-700">
             <div className="relative">
                <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                  <Maximize className="w-10 h-10 text-white/20" strokeWidth={1} />
                </div>
                <label className="absolute inset-0 cursor-pointer">
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
             </div>
             <div className="space-y-4">
                <h1 className="text-2xl font-black uppercase tracking-[0.3em] italic text-white/90">God Crop</h1>
                <p className="text-[#555] text-[10px] font-bold max-w-[200px] leading-relaxed mx-auto uppercase tracking-widest">Select an image from library to initiate the precision pipeline.</p>
             </div>
          </div>
        )}
      </main>

      {/* Lightroom Bottom Controller */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col transition-all duration-300 ${images.length === 0 ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        
        {/* Contextual Sliders */}
        {activeTab === 'shape' && (cropState.shape === 'rounded' || cropState.shape === 'blob' || cropState.shape === 'liquid') && (
           <div className="px-10 py-5 bg-black/60 backdrop-blur-xl border-t border-white/5 fade-up">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4 px-1">
                 <span>{cropState.shape === 'rounded' ? 'Curvature' : 'Surface Detail'}</span>
                 <span className="bg-blue-500/10 px-2 py-0.5 rounded">{cropState.shape === 'rounded' ? cropState.cornerRadius : cropState.shapeConfig.complexity}</span>
              </div>
              <input 
                type="range" 
                min={cropState.shape === 'rounded' ? "0" : "3"} 
                max={cropState.shape === 'rounded' ? "300" : "40"}
                step="1"
                value={cropState.shape === 'rounded' ? cropState.cornerRadius : cropState.shapeConfig.complexity}
                onChange={(e) => {
                  e.stopPropagation();
                  cropState.shape === 'rounded' 
                    ? setCropState(prev => ({ ...prev, cornerRadius: Number(e.target.value) })) 
                    : updateShapeConfig({ complexity: Number(e.target.value) });
                }}
                className="w-full"
                onClick={(e) => e.stopPropagation()}
              />
           </div>
        )}

        {/* Horizontal Options Strip */}
        <div className={`adjustment-bar h-24 border-t border-white/5 flex items-center overflow-x-auto no-scrollbar px-6 gap-8 transition-all duration-300 ${activeTab ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          {activeTab === 'ratio' && ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.label}
              onClick={(e) => { e.stopPropagation(); setCropState(prev => ({ ...prev, aspectRatio: ratio.value })); }}
              className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all ${cropState.aspectRatio === ratio.value ? 'text-blue-500' : 'text-[#555]'}`}
            >
              <div className={`w-6 h-6 rounded-sm border-2 transition-all ${cropState.aspectRatio === ratio.value ? 'bg-blue-600 border-blue-600 scale-110 shadow-lg shadow-blue-600/20' : 'border-current opacity-30'}`} style={{ aspectRatio: ratio.value || 1, maxHeight: '24px' }} />
              <span className="text-[9px] font-black uppercase tracking-widest">{ratio.label}</span>
            </button>
          ))}

          {activeTab === 'shape' && (['square', 'circle', 'rounded', 'pill', 'squircle', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star', 'heart', 'blob', 'liquid', 'svg_path'] as ShapeType[]).map((shape) => (
            <button
              key={shape}
              onClick={(e) => { e.stopPropagation(); setCropState(prev => ({ ...prev, shape })); }}
              className={`flex-shrink-0 flex flex-col items-center gap-3 transition-all ${cropState.shape === shape ? 'text-blue-500' : 'text-[#555]'}`}
            >
               <div className={`w-8 h-8 border flex items-center justify-center transition-all ${cropState.shape === shape ? 'bg-blue-600 border-blue-600 scale-110 shadow-xl' : 'border-white/10 opacity-30'}`}>
                  <span className="text-[8px] font-black text-white">{shape.slice(0, 3).toUpperCase()}</span>
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest">{shape.replace('_', ' ')}</span>
            </button>
          ))}

          {activeTab === 'ai' && (
            <div className="flex gap-4 w-full px-4">
               <button onClick={(e) => { e.stopPropagation(); handleSmartCrop(); }} className="flex-1 h-12 bg-white/5 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest active:bg-white/10 transition-all border border-white/5">
                 <Sparkles size={14} className="text-blue-500" /> Subject Focus
               </button>
               <button onClick={(e) => { e.stopPropagation(); setCropState(prev => ({ ...prev, shape: 'ai_cutout' })); }} className="flex-1 h-12 bg-white/5 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest active:bg-white/10 transition-all border border-white/5">
                 <Palette size={14} className="text-purple-500" /> Neural Cutout
               </button>
            </div>
          )}

          {activeTab === 'library' && (
             <div className="flex items-center gap-4">
               {images.map((img, idx) => (
                 <div 
                   key={img.id}
                   onClick={(e) => { e.stopPropagation(); setSelectedIndex(idx); }}
                   className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${selectedIndex === idx ? 'border-blue-500 scale-110' : 'border-white/5 opacity-40'}`}
                 >
                   <img src={img.preview} className="w-full h-full object-cover" />
                 </div>
               ))}
               <label className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer active:bg-white/10">
                  <Plus size={22} className="text-[#444]" />
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
               </label>
             </div>
          )}
        </div>

        {/* Primary Tool Bar */}
        <nav className="h-16 bg-[#0c0c0c] border-t border-white/5 flex items-center justify-around px-4">
          {[
            { id: 'library', icon: Layers, label: 'Photos' },
            { id: 'ratio', icon: Grid, label: 'Ratio' },
            { id: 'shape', icon: Shapes, label: 'Shape' },
            { id: 'ai', icon: Zap, label: 'AI' },
            { id: 'watermark', icon: Droplets, label: 'Water' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={(e) => { e.stopPropagation(); setActiveTab(activeTab === item.id ? null : item.id as any); }}
              className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === item.id ? 'text-blue-500' : 'text-[#666]'}`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Preferences Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl animate-in fade-in flex flex-col">
          <header className="px-8 h-20 flex items-center justify-between border-b border-white/5">
             <button onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em]">
                <ArrowLeft size={20} /> Preferences
             </button>
          </header>
          <div className="flex-1 p-10 space-y-12">
             <section className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Pipeline</h5>
                <div className="grid grid-cols-2 gap-5">
                   <div className="p-8 bg-white/5 rounded-[2.5rem] space-y-3">
                      <Sparkles className="text-blue-500" size={24} />
                      <p className="font-black text-xs uppercase tracking-widest">Neural Hub</p>
                      <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">Connected</p>
                   </div>
                   <div className="p-8 bg-white/5 rounded-[2.5rem] space-y-3">
                      <Layers className="text-white/20" size={24} />
                      <p className="font-black text-xs uppercase tracking-widest">Version</p>
                      <p className="text-[9px] text-white/10 font-black uppercase tracking-widest">v4.5 Stable</p>
                   </div>
                </div>
             </section>
             <button onClick={() => { setImages([]); setIsMenuOpen(false); }} className="w-full p-8 bg-red-500/5 hover:bg-red-500/10 rounded-[2.5rem] flex items-center justify-between border border-red-500/10 transition-all">
                <div className="flex items-center gap-5">
                   <Trash2 className="text-red-500/50" size={22} />
                   <span className="text-xs font-black uppercase tracking-widest text-red-500/80">Purge Workspace</span>
                </div>
             </button>
          </div>
          <footer className="p-10 text-center opacity-20">
             <p className="text-[10px] font-black tracking-[1.5em] text-white uppercase">God Crop Precision</p>
          </footer>
        </div>
      )}

      {/* Global Processing State */}
      {isProcessing && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
           <div className="w-16 h-16 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-2xl shadow-blue-500/20" />
           <div className="space-y-2 text-center">
             <p className="text-[11px] font-black uppercase tracking-[0.8em] text-blue-500 animate-pulse">Computing Matrix</p>
             <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 italic">Synchronizing Vision Weights...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
