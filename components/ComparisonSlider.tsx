import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MousePointer2 } from 'lucide-react';

interface ComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
  className?: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ beforeUrl, afterUrl, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, [isResizing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleTouchMove]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[400px] overflow-hidden rounded-xl cursor-col-resize select-none shadow-2xl ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* After Image (Background) */}
      <img 
        src={afterUrl} 
        alt="Enhanced" 
        className="absolute inset-0 w-full h-full object-cover" 
        draggable={false}
      />
      
      {/* Label After */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 z-10">
        ENHANCED
      </div>

      {/* Before Image (Foreground, clipped) */}
      <div 
        className="absolute inset-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeUrl} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-cover max-w-none" 
          style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }} // Keep aspect ratio synced
          draggable={false}
        />
        {/* Label Before */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 z-10">
          ORIGINAL
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-20 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white -ml-3.5">
            <MousePointer2 size={16} className="text-white rotate-[-45deg]" />
        </div>
      </div>
    </div>
  );
};

export default ComparisonSlider;