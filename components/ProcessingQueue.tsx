import React from 'react';
import { CheckCircle, XCircle, Loader2, Play, Download, Eye, FileVideo, Image as ImageIcon, Wand2 } from 'lucide-react';
import { MediaItem, ProcessStatus, FileType } from '../types';

interface ProcessingQueueProps {
  items: MediaItem[];
  onRemove: (id: string) => void;
  onPreview: (item: MediaItem) => void;
  onDownloadConfig: (item: MediaItem) => void;
}

const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ items, onRemove, onPreview, onDownloadConfig }) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 space-y-4">
      <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-brand-400" />
        Processing Queue
      </h2>
      
      {items.map((item) => (
        <div 
          key={item.id} 
          className="bg-dark-800 border border-gray-700/50 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 transition-all hover:border-gray-600"
        >
          {/* Thumbnail */}
          <div className="relative w-20 h-20 shrink-0 bg-dark-900 rounded-lg overflow-hidden border border-gray-700">
             {item.type === FileType.VIDEO ? (
                 <video src={item.previewUrl} className="w-full h-full object-cover opacity-80" />
             ) : (
                 <img src={item.previewUrl} alt="Thumb" className="w-full h-full object-cover" />
             )}
             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                {item.type === FileType.VIDEO ? <FileVideo className="text-white/80" /> : <ImageIcon className="text-white/80" />}
             </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-gray-200 truncate pr-4">{item.file.name}</h3>
                {item.status === ProcessStatus.COMPLETED && (
                    <span className="text-xs font-mono text-brand-400 bg-brand-900/30 px-2 py-0.5 rounded border border-brand-500/20">
                        UPSCALED {item.metadata?.scale || 4}X
                    </span>
                )}
            </div>
            
            <p className="text-xs text-gray-500 mb-2">
                {item.metadata?.originalSize} • {item.metadata?.mimeType}
            </p>

            {/* AI Insight */}
            {item.metadata?.aiDescription && (
                <div className="text-xs text-gray-400 italic bg-black/20 p-2 rounded border-l-2 border-brand-500 mb-2 truncate">
                    "AI: {item.metadata.aiDescription}"
                </div>
            )}

            {/* Progress Bar */}
            <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${item.status === ProcessStatus.ERROR ? 'bg-red-500' : 'bg-gradient-to-r from-brand-600 to-brand-400'}`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span className="capitalize">{item.status}...</span>
                <span>{item.progress}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {item.status === ProcessStatus.PROCESSING || item.status === ProcessStatus.UPLOADING ? (
                <button className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Cancel">
                    <XCircle size={24} />
                </button>
            ) : item.status === ProcessStatus.COMPLETED ? (
                <>
                    <button 
                        onClick={() => onPreview(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-900 hover:bg-dark-950 text-gray-300 rounded-lg border border-gray-700 transition-colors text-sm font-medium"
                    >
                        <Eye size={16} /> Compare
                    </button>
                    <button 
                        onClick={() => onDownloadConfig(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-lg shadow-brand-900/20 transition-all text-sm font-medium"
                    >
                        <Download size={16} /> Download
                    </button>
                </>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProcessingQueue;