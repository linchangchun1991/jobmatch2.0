import React, { useState } from 'react';
import { AppState, Role } from './types';
import { BD_CODE, COACH_CODE } from './constants';
import { BdDashboard } from './components/BdDashboard';
import { CoachDashboard } from './components/CoachDashboard';
import { Button } from './components/ui/Button';
import { Briefcase, UserCheck, Lock, ChevronRight, Zap, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRole === 'bd') {
      if (passcodeInput !== BD_CODE) {
        alert("访问拒绝：BD 端访问码错误 (提示: hm2025)");
        return;
      }
      setAppState(AppState.BD_DASHBOARD);
    } 
    else if (selectedRole === 'coach') {
      if (passcodeInput !== COACH_CODE) {
        alert("访问拒绝：教练端访问码错误 (提示: coach001)");
        return;
      }
      setAppState(AppState.COACH_DASHBOARD);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setPasscodeInput(''); 
  };

  // 打字机特效组件
  const TypewriterTitle = () => {
    const title = "Highmark";
    const slogan = "扶稳留学生，走好职场第一步";

    const titleVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: i * 0.1,
          type: "spring",
          stiffness: 100
        },
      }),
    };

    const sloganVariants = {
      hidden: { opacity: 0 },
      visible: (i: number) => ({
        opacity: 1,
        transition: {
          delay: 1.0 + (i * 0.08), 
        },
      }),
    };

    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center">
          {title.split("").map((char, i) => (
            <motion.span
              key={`t-${char}-${i}`}
              custom={i}
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              className="text-6xl md:text-7xl font-bold text-white tracking-tight glow-text"
            >
              {char}
            </motion.span>
          ))}
        </div>
        <div className="flex items-center justify-center mt-4">
           {slogan.split("").map((char, i) => (
            <motion.span
              key={`s-${char}-${i}`}
              custom={i}
              variants={sloganVariants}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl text-aurora-300 font-medium tracking-widest font-mono"
            >
              {char}
            </motion.span>
          ))}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="w-2 h-6 bg-aurora-500 ml-2 rounded-sm"
          />
        </div>
      </div>
    );
  };

  const renderAuth = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nebula-500 to-aurora-500 flex items-center justify-center shadow-lg shadow-nebula-500/20">
                <Zap className="text-white fill-white" size={20} />
             </div>
             <span className="text-sm font-mono text-aurora-400 tracking-widest border border-aurora-500/20 px-2 py-1 rounded bg-aurora-500/5">INTERNAL SYSTEM v2.5</span>
          </div>
          
          <div className="mb-4 h-auto min-h-[140px] flex items-center justify-center">
            <TypewriterTitle />
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="text-slate-400 text-lg tracking-wide"
          >
            海马职加 · 智能人岗匹配引擎
          </motion.p>
        </motion.div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
          {/* Coach Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(139, 92, 246, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect('coach')}
            className={`cursor-pointer relative group overflow-hidden p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
              selectedRole === 'coach' 
                ? 'bg-nebula-500/10 border-nebula-500 ring-1 ring-nebula-500/50' 
                : 'bg-glass-100 border-glass-border hover:border-glass-border/50'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              selectedRole === 'coach' ? 'bg-nebula-500 text-white' : 'bg-cosmos-800 text-slate-400 group-hover:text-white'
            }`}>
              <UserCheck size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-nebula-400 transition-colors">交付端 / 教练</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              进入匹配引擎，上传简历(支持PDF/图片)，一键生成推荐报告。
            </p>
            <div className={`absolute bottom-0 left-0 h-1 bg-nebula-500 transition-all duration-300 ${selectedRole === 'coach' ? 'w-full' : 'w-0 group-hover:w-full'}`}></div>
          </motion.div>

          {/* BD Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(56, 189, 248, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect('bd')}
            className={`cursor-pointer relative group overflow-hidden p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
              selectedRole === 'bd' 
                ? 'bg-aurora-500/10 border-aurora-500 ring-1 ring-aurora-500/50' 
                : 'bg-glass-100 border-glass-border hover:border-glass-border/50'
            }`}
          >
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              selectedRole === 'bd' ? 'bg-aurora-500 text-white' : 'bg-cosmos-800 text-slate-400 group-hover:text-white'
            }`}>
              <Briefcase size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-aurora-400 transition-colors">供给端 / BD</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              管理企业资源，批量清洗招聘JD文本，维护实时岗位数据库。
            </p>
            <div className={`absolute bottom-0 left-0 h-1 bg-aurora-500 transition-all duration-300 ${selectedRole === 'bd' ? 'w-full' : 'w-0 group-hover:w-full'}`}></div>
          </motion.div>
        </div>

        {/* Passcode Input Area */}
        <AnimatePresence>
          {selectedRole && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleLogin} 
              className="w-full max-w-md"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-nebula-500 to-aurora-500 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex gap-2 bg-cosmos-900 rounded-lg p-2 border border-glass-border">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="password" 
                      placeholder={selectedRole === 'bd' ? "请输入 BD 访问码" : "请输入教练访问码"}
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
                {selectedRole === 'bd' ? 'SECURE ZONE: SUPPLY CHAIN' : 'SECURE ZONE: DELIVERY CORE'}
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-nebula-500 selection:text-white">
      <AnimatePresence mode="wait">
        {appState === AppState.AUTH && (
          <motion.div key="auth" exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}>
            {renderAuth()}
          </motion.div>
        )}
        
        {appState !== AppState.AUTH && (
          <motion.div 
            key="app" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="min-h-screen flex flex-col relative z-10"
          >
            {/* Top Navigation Bar */}
            <nav className="h-16 border-b border-glass-border bg-cosmos-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
              <div className="flex items-center gap-3">
                 <div className="font-bold text-lg text-white tracking-tight">HMG丨Highmark career留学生就业求职辅导首选</div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                   <span className="text-xs font-mono text-aurora-400">
                      {appState === AppState.BD_DASHBOARD ? 'NODE: BD_SUPPLY' : 'NODE: COACH_DELIVERY'}
                   </span>
                   <span className="text-[10px] text-slate-500">SECURE CONNECTION</span>
                </div>
                <div className="h-8 w-[1px] bg-glass-border"></div>
                <button 
                  onClick={() => {
                    setAppState(AppState.AUTH);
                    setSelectedRole(null);
                    setPasscodeInput('');
                  }} 
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
                >
                  <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                  退出
                </button>
              </div>
            </nav>

            <main className="flex-1 p-6">
              {appState === AppState.BD_DASHBOARD ? <BdDashboard /> : <CoachDashboard />}
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}