import React, { useState } from 'react';
import { AppState, Role } from './types';
import { BD_CODE, COACH_CODE } from './constants';
import { BdDashboard } from './components/BdDashboard';
import { CoachDashboard } from './components/CoachDashboard';
import { Button } from './components/ui/Button';
import { Briefcase, UserCheck, Lock, ChevronRight, Zap, LogOut } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRole === 'bd') {
      if (passcodeInput !== BD_CODE) {
        alert("访问拒绝：BD 端通行码错误 (提示: hm2025)");
        return;
      }
      setAppState(AppState.BD_DASHBOARD);
    } 
    else if (selectedRole === 'coach') {
      if (passcodeInput !== COACH_CODE) {
        alert("访问拒绝：教练端通行码错误 (提示: coach001)");
        return;
      }
      setAppState(AppState.COACH_DASHBOARD);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setPasscodeInput(''); 
  };

  const renderAuth = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden animate-fadeIn">
      {/* 背景光效 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nebula-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aurora-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nebula-500 to-aurora-500 flex items-center justify-center shadow-lg shadow-nebula-500/20 animate-pulse">
                <Zap className="text-white fill-white" size={20} />
             </div>
             <span className="text-sm font-mono text-aurora-400 tracking-widest border border-aurora-500/20 px-2 py-1 rounded bg-aurora-500/5">INTERNAL SYSTEM</span>
          </div>
          
          <div className="mb-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-2xl">Highmark</h1>
            <p className="mt-4 text-xl md:text-2xl text-aurora-200 font-medium tracking-widest font-mono">
              智能人才中台系统
            </p>
          </div>
          
          <p className="text-slate-400 text-lg tracking-wide mt-8">
            Internal Data & Intelligent Matching System
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
          {/* Coach Card */}
          <div 
            onClick={() => handleRoleSelect('coach')}
            className={`cursor-pointer relative group overflow-hidden p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
              selectedRole === 'coach' 
                ? 'bg-nebula-500/10 border-nebula-500 ring-1 ring-nebula-500/50 shadow-nebula-500/20' 
                : 'bg-glass-100 border-glass-border hover:border-glass-border/50'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${
              selectedRole === 'coach' ? 'bg-nebula-500 text-white' : 'bg-cosmos-800 text-slate-400 group-hover:text-white group-hover:bg-nebula-500/80'
            }`}>
              <UserCheck size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-nebula-400 transition-colors">交付端 / 教练</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Coach / Delivery
              <br/>
              人岗匹配、简历解析与推荐报告生成。
            </p>
            <div className={`absolute bottom-0 left-0 h-1 bg-nebula-500 transition-all duration-300 ${selectedRole === 'coach' ? 'w-full' : 'w-0 group-hover:w-full'}`}></div>
          </div>

          {/* BD Card */}
          <div 
            onClick={() => handleRoleSelect('bd')}
            className={`cursor-pointer relative group overflow-hidden p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
              selectedRole === 'bd' 
                ? 'bg-aurora-500/10 border-aurora-500 ring-1 ring-aurora-500/50 shadow-aurora-500/20' 
                : 'bg-glass-100 border-glass-border hover:border-glass-border/50'
            }`}
          >
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${
              selectedRole === 'bd' ? 'bg-aurora-500 text-white' : 'bg-cosmos-800 text-slate-400 group-hover:text-white group-hover:bg-aurora-500/80'
            }`}>
              <Briefcase size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-aurora-400 transition-colors">供给端 / BD</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Supply / BD
              <br/>
              岗位数据的清洗、录入与库管理。
            </p>
            <div className={`absolute bottom-0 left-0 h-1 bg-aurora-500 transition-all duration-300 ${selectedRole === 'bd' ? 'w-full' : 'w-0 group-hover:w-full'}`}></div>
          </div>
        </div>

        {/* Passcode Input Area */}
        {selectedRole && (
          <form 
            onSubmit={handleLogin} 
            className="w-full max-w-md animate-slideUp"
          >
            <div className="relative group">
              <div className="relative flex gap-2 bg-cosmos-900 rounded-lg p-2 border border-glass-border focus-within:border-white/20 transition-colors">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="password" 
                    placeholder="请输入内部通行码"
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-slate-600 focus:outline-none font-mono tracking-widest text-lg"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="px-6 shadow-none">
                  <ChevronRight size={20} />
                </Button>
              </div>
            </div>
            <p className="text-center text-slate-600 text-xs mt-4 font-mono">
              SECURE ZONE: AUTHORIZED PERSONNEL ONLY
            </p>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-nebula-500 selection:text-white">
      {appState === AppState.AUTH && renderAuth()}
      
      {appState !== AppState.AUTH && (
        <div className="min-h-screen flex flex-col relative z-10 animate-fadeIn">
          {/* Top Navigation Bar */}
          <nav className="h-16 border-b border-glass-border bg-cosmos-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded bg-gradient-to-br from-nebula-600 to-aurora-600 flex items-center justify-center">
                  <Zap size={16} className="text-white fill-white" />
               </div>
               <div className="font-bold text-lg text-white tracking-tight">HMG 智能中台</div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <span className="text-xs font-mono text-aurora-400 font-bold">
                    {appState === AppState.BD_DASHBOARD ? '当前节点: 供给端 (BD)' : '当前节点: 交付端 (Coach)'}
                 </span>
                 <span className="text-[10px] text-slate-500">安全连接已建立</span>
              </div>
              <div className="h-8 w-[1px] bg-glass-border"></div>
              <button 
                onClick={() => {
                  setAppState(AppState.AUTH);
                  setSelectedRole(null);
                  setPasscodeInput('');
                }} 
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group px-3 py-1.5 rounded-md hover:bg-white/5"
              >
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                退出系统
              </button>
            </div>
          </nav>

          <main className="flex-1 p-6">
            {appState === AppState.BD_DASHBOARD ? <BdDashboard /> : <CoachDashboard />}
          </main>
        </div>
      )}
    </div>
  );
}