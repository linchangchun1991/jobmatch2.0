import React, { useState, useEffect } from 'react';
import { MOCK_LOADING_PHASES } from '../constants';

interface HolographicLoaderProps {
  onComplete: () => void;
}

export const HolographicLoader: React.FC<HolographicLoaderProps> = ({ onComplete }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 进度条逻辑
    const totalDuration = 2000; // 2秒完成，保持流畅
    const intervalTime = totalDuration / 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 300);
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
    <div className="flex flex-col items-center justify-center w-full h-72 bg-cosmos-900/80 backdrop-blur-md rounded-2xl border border-glass-border relative overflow-hidden shadow-2xl animate-fadeIn">
      {/* 背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-nebula-500/5 to-aurora-500/5 pointer-events-none"></div>

      <div className="w-full max-w-md px-8 text-center relative z-10">
        
        <div className="mb-8 relative">
            <div className="absolute inset-0 bg-nebula-500/20 blur-xl rounded-full scale-75 animate-pulse"></div>
            <div className="w-20 h-20 mx-auto rounded-full border-[3px] border-cosmos-800 border-t-nebula-500 border-r-aurora-500 animate-spin mb-4 relative z-10"></div>
            <span className="text-white font-mono font-bold text-2xl tracking-tighter">{progress}%</span>
        </div>

        <div className="h-8 flex items-center justify-center mb-6">
          <div className="text-sm font-medium text-aurora-300 tracking-wider animate-pulse">
            {MOCK_LOADING_PHASES[phaseIndex]?.text || "系统处理中..."}
          </div>
        </div>

        {/* 进度条轨道 */}
        <div className="w-full bg-cosmos-950 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-nebula-500 to-aurora-400 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              style={{ width: `${progress}%` }}
            />
        </div>
      </div>
    </div>
  );
};