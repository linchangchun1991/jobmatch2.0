import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_LOADING_PHASES } from '../constants';

interface HolographicLoaderProps {
  onComplete: () => void;
}

export const HolographicLoader: React.FC<HolographicLoaderProps> = ({ onComplete }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Phase timer logic
    const totalDuration = 3500; // 3.5 seconds
    const intervalTime = totalDuration / 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay after 100%
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Sync text phase with progress
  useEffect(() => {
    const currentPhase = MOCK_LOADING_PHASES.findIndex(p => p.progress >= progress);
    if (currentPhase !== -1 && currentPhase !== phaseIndex) {
      setPhaseIndex(currentPhase);
    }
  }, [progress, phaseIndex]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-80 bg-cosmos-950/80 backdrop-blur-sm rounded-xl border border-nebula-500/30 shadow-[0_0_50px_rgba(139,92,246,0.1)] relative overflow-hidden group">
      
      {/* Moving Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-20" 
        style={{ 
            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)', 
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)'
        }}
      ></div>

      {/* Scanning Beam */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-nebula-500/20 to-transparent z-10 border-t border-nebula-400/50"
        animate={{ top: ["-100%", "100%"] }}
        transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
      />

      <div className="z-20 w-full max-w-lg px-8 text-center relative">
        {/* Holographic Circle */}
        <div className="w-24 h-24 mx-auto mb-8 relative flex items-center justify-center">
            <motion.div 
                className="absolute inset-0 border-2 border-dashed border-nebula-500 rounded-full opacity-50"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
             <motion.div 
                className="absolute inset-2 border-2 border-aurora-500 rounded-full opacity-70"
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-white font-mono font-bold text-xl">{progress}%</span>
        </div>

        {/* Text Fader */}
        <div className="h-12 flex items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              className="text-lg font-mono text-aurora-300 tracking-wider"
            >
              {MOCK_LOADING_PHASES[phaseIndex]?.text || "INITIALIZING..."}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Cyber Progress Bar */}
        <div className="w-full bg-cosmos-900 rounded-none h-1 overflow-hidden relative border border-white/10">
            <motion.div 
              className="h-full bg-gradient-to-r from-nebula-500 via-aurora-400 to-white"
              style={{ width: `${progress}%` }}
              layoutId="progressBar"
            />
        </div>
        
        <div className="mt-4 flex justify-between text-[10px] text-slate-500 font-mono tracking-widest uppercase">
           <span>Core: Active</span>
           <span>Threads: 12</span>
           <span>Mem: 4096MB</span>
        </div>
      </div>
    </div>
  );
};