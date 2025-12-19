import React, { useState, useEffect } from 'react';
import { MOCK_LOADING_PHASES } from '../constants';

interface HolographicLoaderProps {
  onComplete: () => void;
}

export const HolographicLoader: React.FC<HolographicLoaderProps> = ({ onComplete }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simple timer logic
    const totalDuration = 2500; // 2.5 seconds (Faster)
    const intervalTime = totalDuration / 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const currentPhase = MOCK_LOADING_PHASES.findIndex(p => p.progress >= progress);
    if (currentPhase !== -1 && currentPhase !== phaseIndex) {
      setPhaseIndex(currentPhase);
    }
  }, [progress, phaseIndex]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-64 bg-cosmos-900/80 backdrop-blur-sm rounded-xl border border-glass-border relative overflow-hidden">
      <div className="w-full max-w-md px-8 text-center relative z-10">
        
        <div className="mb-8">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-cosmos-800 border-t-nebula-500 animate-spin mb-4"></div>
            <span className="text-white font-mono font-bold text-xl">{progress}%</span>
        </div>

        <div className="h-8 flex items-center justify-center mb-4">
          <div className="text-sm font-mono text-aurora-300 tracking-wider">
            {MOCK_LOADING_PHASES[phaseIndex]?.text || "Processing..."}
          </div>
        </div>

        <div className="w-full bg-cosmos-950 rounded-full h-2 overflow-hidden border border-white/5">
            <div 
              className="h-full bg-nebula-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
        </div>
      </div>
    </div>
  );
};