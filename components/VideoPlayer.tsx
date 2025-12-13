import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Maximize, Settings, Captions, EyeOff, ShieldAlert, PictureInPicture } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
  poster: string;
  title: string;
  autoPlay?: boolean;
  onComplete?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ poster, title, autoPlay = false, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [isObscured, setIsObscured] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- SECURITY FEATURES ---

  // 1. Disable Right Click (Context Menu)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // 1.5 Disable Dragging (Prevent drag to desktop)
  const handleDragStart = (e: React.DragEvent) => {
      e.preventDefault();
      return false;
  };

  // 2. Window Blur/Focus Detection (Stop playback if user switches windows/tabs)
  useEffect(() => {
    const handleBlur = () => {
      if (isPlaying) {
        setIsPlaying(false);
        setIsObscured(true);
        setSecurityMessage('Playback paused for security (Window lost focus)');
      }
    };

    const handleFocus = () => {
      if (!isPlaying) {
          setIsObscured(false);
          setSecurityMessage('');
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isPlaying]);

  // 3. Screenshot/Screen Recording Key Detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (
            e.key === 'PrintScreen' || 
            (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
            (e.ctrlKey && e.key === 'p') || 
            (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's')
        ) {
            setIsPlaying(false);
            setIsObscured(true);
            setSecurityMessage('Screen capture detected. Content is protected.');
            
            setTimeout(() => {
                setIsObscured(false);
                setSecurityMessage('');
            }, 3000);
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- VIDEO PLAYER LOGIC ---

  // Sync isPlaying state with video element
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && !isObscured) {
        videoRef.current.play().catch(e => {
            // Auto-play policies might block this without user interaction
            console.log("Play interrupted or waiting for interaction", e);
            setIsPlaying(false); 
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isObscured]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration;
        setProgress((current / total) * 100);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (onComplete) onComplete();
  };

  const togglePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP failed:", error);
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isObscured) setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
      if (!seconds) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
        ref={containerRef}
        className="relative group bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl select-none"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
    >
      {/* SECURITY: Watermark Layer */}
      {isPlaying && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <div className="absolute top-10 left-10 opacity-20 text-white text-xs font-mono rotate-[-15deg] whitespace-nowrap">
                  ID: {Math.random().toString(36).substr(2, 9)} • Protected Content • Lekol Alèz
              </div>
              <div className="absolute bottom-20 right-20 opacity-10 text-white text-sm font-mono whitespace-nowrap">
                  Do Not Distribute
              </div>
              {/* Moving Watermark Animation */}
              <motion.div 
                animate={{ x: [0, 100, 0], y: [0, 50, 0], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-1/2 left-1/3 text-white/10 text-4xl font-black uppercase tracking-widest pointer-events-none"
              >
                  Lekol Alèz
              </motion.div>
          </div>
      )}

      {/* SECURITY: Blackout Curtain */}
      <AnimatePresence>
          {isObscured && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
              >
                  <div className="bg-red-500/20 p-4 rounded-full mb-4">
                     <ShieldAlert size={48} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Restricted Action</h3>
                  <p className="text-gray-400 max-w-sm">
                      {securityMessage || "Recording or capturing this content is prohibited."}
                  </p>
                  <button 
                    onClick={() => setIsObscured(false)}
                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                  >
                      Resume Playback
                  </button>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Transparent Overlay to prevent direct interaction with underlying media elements if needed */}
      <div className="absolute inset-0 z-[5]" />

      {/* Main Video Area */}
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black cursor-pointer"
        onClick={() => togglePlay()}
      >
        <video
            ref={videoRef}
            src="https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-monitor-close-up-1728-large.mp4"
            className="w-full h-full object-cover"
            poster={poster}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            controlsList="nodownload"
        />
        
        {/* Play Button Overlay */}
        {!isPlaying && !isObscured && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all z-20">
             <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 bg-brand-blue rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/40"
             >
                <Play size={32} fill="currentColor" className="ml-1" />
             </motion.button>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 z-20 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        {/* Progress Bar */}
        <div 
            className="relative h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group/progress"
            onClick={(e) => {
                 e.stopPropagation();
                 if (videoRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    videoRef.current.currentTime = pos * videoRef.current.duration;
                 }
            }}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-brand-blue rounded-full relative"
            style={{ width: `${progress}%` }}
          >
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-md transform scale-0 group-hover/progress:scale-100 transition-all"></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={(e) => togglePlay(e)} className="hover:text-brand-blue transition-colors">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <div className="flex items-center gap-2 group/volume cursor-pointer" onClick={(e) => e.stopPropagation()}>
               <Volume2 size={20} />
               <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300">
                  <div className="h-1 bg-white/30 rounded-full w-16 ml-2">
                     <div className="h-full bg-white w-[70%] rounded-full"></div>
                  </div>
               </div>
            </div>

            <div className="text-xs font-medium text-white/80">
                <span>{videoRef.current ? formatTime(videoRef.current.currentTime) : "0:00"}</span>
                <span className="mx-1">/</span>
                <span>{videoRef.current ? formatTime(videoRef.current.duration) : "0:00"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* PiP Button */}
             <button onClick={togglePiP} className="hover:text-brand-blue transition-colors" title="Picture in Picture">
                <PictureInPicture size={20} />
             </button>

             <button className="hover:text-brand-blue transition-colors" title="Captions" onClick={(e) => e.stopPropagation()}>
                <Captions size={20} />
             </button>
             <div className="flex items-center gap-1 text-xs text-white/30 border border-white/20 rounded px-1.5 py-0.5 select-none">
                 <EyeOff size={10} /> Protected
             </div>
             <button className="hover:text-brand-blue transition-colors" title="Settings" onClick={(e) => e.stopPropagation()}>
                <Settings size={20} />
             </button>
             <button className="hover:text-brand-blue transition-colors" title="Fullscreen" onClick={(e) => e.stopPropagation()}>
                <Maximize size={20} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};