import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, Zap, Sparkles, X, Download, FileType as FileTypeIcon, AlertCircle, Settings2 } from 'lucide-react';
import { MediaItem, ProcessStatus, FileType, OutputFormat } from './types';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE_MB } from './constants';
import { formatFileSize, getImageDimensions, convertImageFormat, downloadBlob } from './services/imageUtils';
import { analyzeImageContent, mockUpscaleProcess } from './services/geminiService';
import ComparisonSlider from './components/ComparisonSlider';
import ProcessingQueue from './components/ProcessingQueue';

function App() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [downloadModalItem, setDownloadModalItem] = useState<MediaItem | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(OutputFormat.JPG);
  const [isConverting, setIsConverting] = useState(false);
   
  // Configuration State
  const [upscaleFactor, setUpscaleFactor] = useState<number>(4);

  // --- 🟢 ADSTERRA SCRIPT INJECTION (ADDED HERE) ---
  useEffect(() => {
    // Check if script already exists to prevent duplicates
    if (!document.getElementById('adsterra-banner-script')) {
      const script = document.createElement('script');
      script.id = 'adsterra-banner-script';
      script.src = "//pl28180610.effectivegatecpm.com/06f0176bc2c5fc4587c7f06c85926ab7/invoke.js";
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      document.body.appendChild(script);
    }
  }, []);
  // --------------------------------------------------

  // --- File Handling ---

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newItems: MediaItem[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }

      const isVideo = file.type.startsWith('video/');
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
        continue;
      }

      const id = Math.random().toString(36).substring(7);
      const url = URL.createObjectURL(file);
       
      let dimensions = 'Unknown';
      if (!isVideo) {
         try {
             const dims = await getImageDimensions(file);
             dimensions = `${dims.width}x${dims.height}`;
         } catch(e) {}
      }

      const newItem: MediaItem = {
        id,
        file,
        type: isVideo ? FileType.VIDEO : FileType.IMAGE,
        previewUrl: url,
        status: ProcessStatus.IDLE,
        progress: 0,
        metadata: {
            originalSize: formatFileSize(file.size),
            dimensions,
            mimeType: file.type,
            scale: upscaleFactor // Store selected scale
        }
      };

      newItems.push(newItem);
    }

    setItems(prev => [...prev, ...newItems]);
    
    // Auto-start processing with current config
    newItems.forEach(item => startProcessing(item.id, item.file, upscaleFactor));

  }, [upscaleFactor]);

  const startProcessing = async (id: string, file: File, scale: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: ProcessStatus.PROCESSING, progress: 5 } : i));

    try {
        // 1. Run AI Analysis (Gemini)
        const aiDesc = await analyzeImageContent(file);
        
        setItems(prev => prev.map(i => i.id === id ? { 
            ...i, 
            progress: 25, 
            metadata: { ...i.metadata!, aiDescription: aiDesc } 
        } : i));

        // 2. Run Upscaling (Mock Service)
        const processedUrl = await mockUpscaleProcess(file, scale, (p) => {
             // Map 0-100 from service to 25-90 in UI
             const mappedProgress = 25 + (p * 0.65);
             setItems(prev => prev.map(i => i.id === id ? { ...i, progress: mappedProgress } : i));
        });

        // 3. Complete
        setItems(prev => prev.map(i => i.id === id ? { 
            ...i, 
            status: ProcessStatus.COMPLETED, 
            progress: 100, 
            processedUrl: processedUrl // In real app, this is the High-Res URL
        } : i));

    } catch (error) {
        setItems(prev => prev.map(i => i.id === id ? { 
            ...i, 
            status: ProcessStatus.ERROR, 
            error: "Processing failed. Please try again." 
        } : i));
    }
  };

  // --- Drag & Drop ---

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // --- Conversion & Download ---

  const handleDownload = async () => {
    if (!downloadModalItem || !downloadModalItem.processedUrl) return;
    
    setIsConverting(true);
    try {
        const filename = `enhanced_${downloadModalItem.file.name.split('.')[0]}.${selectedFormat.split('/')[1]}`;
        
        const blob = await convertImageFormat(
            downloadModalItem.processedUrl, 
            selectedFormat
        );
        
        downloadBlob(blob, filename);
        setDownloadModalItem(null); // Close modal
    } catch (e) {
        alert("Error converting file.");
        console.error(e);
    } finally {
        setIsConverting(false);
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Sparkles className="text-white fill-current" size={24} />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                NeuralScale <span className="text-brand-400">AI</span>
            </h1>
        </div>
      </header>

      {/* Hero / Drop Zone */}
      <div className="w-full max-w-4xl text-center mb-8">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Upscale Image & Video <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-500">
                with AI Precision
            </span>
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Enhance resolution up to 16x, remove noise, and restore details using next-gen models. 
            Supports JPG, PNG, WEBP, and MP4.
        </p>

        {/* Configuration Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 animate-fade-in-up">
            <div className="bg-dark-800 p-1.5 rounded-xl border border-gray-700 flex items-center">
                <div className="flex items-center px-3 text-gray-400 gap-2 border-r border-gray-700 mr-2">
                    <Settings2 size={16} />
                    <span className="text-sm font-medium">Scale</span>
                </div>
                {[2, 4, 8, 16].map((scale) => (
                    <button
                        key={scale}
                        onClick={() => setUpscaleFactor(scale)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            upscaleFactor === scale 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {scale}x
                    </button>
                ))}
            </div>
            <div className="bg-brand-900/30 border border-brand-500/20 px-3 py-1.5 rounded-lg text-xs font-mono text-brand-400 flex items-center gap-2">
                <Zap size={12} />
                {upscaleFactor >= 8 ? 'ULTRA DETAIL MODE' : 'BALANCED MODE'}
            </div>
        </div>

        <div 
            className={`relative group border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ease-out
            ${dragActive ? 'border-brand-500 bg-brand-900/20 scale-[1.02]' : 'border-gray-700 hover:border-brand-500/50 hover:bg-dark-800'}
            bg-dark-900/50 backdrop-blur-sm`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                multiple 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileSelect}
                accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
            />
             
            <div className="flex flex-col items-center justify-center gap-4 pointer-events-none">
                <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-gray-700 group-hover:border-brand-500/50">
                    <UploadCloud className={`w-10 h-10 ${dragActive ? 'text-brand-400' : 'text-gray-400'}`} />
                </div>
                <div className="space-y-2">
                    <p className="text-xl font-medium text-gray-200">
                        Drop files here or <span className="text-brand-400 underline decoration-2 underline-offset-4">click to upload</span>
                    </p>
                    <p className="text-sm text-gray-500">
                        Selected: <span className="text-brand-400 font-bold">{upscaleFactor}x Upscale</span> • Max {MAX_FILE_SIZE_MB}MB
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🟢 AD SLOT 3: ADSTERRA NATIVE BANNER (UPDATED)                            */}
      {/* ========================================================================= */}
      <div className="w-full max-w-5xl my-6 flex justify-center">
         {/* This ID matches the script in the useEffect above */}
         <div id="container-06f0176bc2c5fc4587c7f06c85926ab7"></div>
      </div>
      {/* ========================================================================= */}

      {/* Processing List */}
      <ProcessingQueue 
        items={items} 
        onRemove={(id) => setItems(prev => prev.filter(i => i.id !== id))}
        onPreview={setPreviewItem}
        onDownloadConfig={setDownloadModalItem}
      />

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-6xl flex flex-col gap-4">
                <div className="flex justify-between items-center text-white">
                    <h3 className="text-xl font-bold">Enhancement Comparison ({previewItem.metadata?.scale || 4}x)</h3>
                    <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-white/10 rounded-full">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="w-full aspect-video md:aspect-auto md:h-[70vh] rounded-2xl overflow-hidden border border-gray-700 bg-dark-900">
                    {previewItem.type === FileType.VIDEO ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <video src={previewItem.processedUrl || previewItem.previewUrl} controls className="max-h-full" />
                        </div>
                    ) : (
                        <ComparisonSlider 
                            beforeUrl={previewItem.previewUrl} 
                            afterUrl={previewItem.processedUrl || previewItem.previewUrl} // Fallback to original if processing simulated
                            className="w-full h-full"
                        />
                    )}
                </div>
                
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={() => {
                            setDownloadModalItem(previewItem);
                            setPreviewItem(null);
                        }}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >
                        <Download size={20} /> Download Enhanced
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Download Options Modal */}
      {downloadModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-dark-800 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-white">Download Options</h3>
                    <button onClick={() => setDownloadModalItem(null)} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Select Format</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'JPG', value: OutputFormat.JPG },
                                { label: 'PNG', value: OutputFormat.PNG },
                                { label: 'WEBP', value: OutputFormat.WEBP },
                            ].map((fmt) => (
                                <button
                                    key={fmt.label}
                                    onClick={() => setSelectedFormat(fmt.value)}
                                    className={`py-3 rounded-lg border font-medium transition-all ${
                                        selectedFormat === fmt.value 
                                        ? 'border-brand-500 bg-brand-500/10 text-brand-400' 
                                        : 'border-gray-700 bg-dark-900 text-gray-400 hover:border-gray-600'
                                    }`}
                                >
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-dark-900 p-4 rounded-lg flex gap-3 border border-gray-700">
                        <AlertCircle className="text-brand-400 shrink-0" size={20} />
                        <p className="text-xs text-gray-400">
                            Client-side conversion active. Your file is converted in your browser, ensuring maximum privacy and speed.
                        </p>
                    </div>

                    <button 
                        onClick={handleDownload}
                        disabled={isConverting}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isConverting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Converting...
                            </>
                        ) : (
                            <>Download File</>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default App;
