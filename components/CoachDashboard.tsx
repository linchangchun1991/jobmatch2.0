
import React, { useState, useRef, useMemo } from 'react';
import { HolographicLoader } from './HolographicLoader';
import { dbService } from '../services/dbService';
import { quickLocalMatch } from '../services/geminiService'; // 仅导入本地匹配
import { parseFile } from '../utils/fileParser';
import { MatchResult } from '../types';
import { Button } from './ui/Button';
import { Sparkles, MapPin, ArrowRight, Building2, BrainCircuit, RefreshCw, FileSpreadsheet, Upload, X, Loader2, Shuffle } from 'lucide-react';
import * as XLSX from 'xlsx';

const BATCH_SIZE = 50;

export const CoachDashboard: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [isLoaderActive, setIsLoaderActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // 核心数据状态
  const [allMatches, setAllMatches] = useState<MatchResult[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 计算当前批次显示的岗位
  const displayedMatches = useMemo(() => {
    const start = batchIndex * BATCH_SIZE;
    return allMatches.slice(start, start + BATCH_SIZE);
  }, [allMatches, batchIndex]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseStatus('正在启动多模态解析引擎...');
    setErrorMsg(null);

    try {
      const text = await parseFile(file, (status) => setParseStatus(status));
      if (!text || text.trim().length < 20) {
        throw new Error('无法从文件中提取有效文本，请确保文件内容清晰且非纯图片扫描件。');
      }
      setResumeText(prev => prev + '\n' + text);
    } catch (err: any) {
      setErrorMsg(`解析失败: ${err.message}`);
    } finally {
      setIsParsing(false);
      setParseStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startMatching = async () => {
    if (!resumeText.trim()) {
      setErrorMsg("请先输入或上传简历内容");
      return;
    }

    setIsLoaderActive(true);
    setShowResults(false);
    setErrorMsg(null);
    setAllMatches([]);
    setBatchIndex(0);
    
    try {
      const jobs = await dbService.getJobs();
      if (jobs.length === 0) {
        setErrorMsg("数据库暂无岗位数据，请联系 BD 部门补充库存。");
        setIsLoaderActive(false);
        return;
      }

      const localMatches = quickLocalMatch(resumeText, jobs);
      
      if (localMatches.length === 0) {
        setErrorMsg("未找到匹配的岗位，请尝试补充更多简历细节。");
        setIsLoaderActive(false);
        return;
      }

      setAllMatches(localMatches);

    } catch (e) {
      setErrorMsg("无法连接至核心数据库，请检查网络连接。");
      setIsLoaderActive(false);
    }
  };

  const onAnimationComplete = () => {
    setIsLoaderActive(false);
    setShowResults(true);
  };

  const handleNextBatch = () => {
    const maxIndex = Math.ceil(allMatches.length / BATCH_SIZE) - 1;
    setBatchIndex(prev => prev >= maxIndex ? 0 : prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    if (displayedMatches.length === 0) return;

    // 仅导出当前批次
    const exportData = displayedMatches.map((r, index) => ({
      "推荐排名": (batchIndex * BATCH_SIZE) + index + 1,
      "公司名称": r.company,
      "工作地点": r.location,
      "匹配岗位": r.role,
      "匹配指数": `${r.matchScore}%`,
      "投递链接": r.link
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wscols = [{wch: 6}, {wch: 20}, {wch: 10}, {wch: 30}, {wch: 8}, {wch: 40}];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "岗位推荐表");
    XLSX.writeFile(wb, `Highmark_推荐报告_Batch${batchIndex + 1}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 animate-fadeIn">
      {!showResults && !isLoaderActive && (
        <header className="mb-10 text-center">
          <div className="inline-block relative">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">AI 智能人岗匹配中台</h1>
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nebula-500 to-transparent opacity-60"></div>
          </div>
          <p className="text-slate-400 mt-6 font-mono text-sm tracking-wide">极速匹配引擎 (Cloudflare D1 Accelerated) • 支持多模态简历解析</p>
        </header>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-lg font-mono flex items-center justify-center gap-2 animate-slideUp">
          <X size={16} /> [系统警报] {errorMsg}
        </div>
      )}

      {!isLoaderActive && !showResults && (
        <div className="bg-cosmos-900/60 backdrop-blur-xl rounded-2xl border border-glass-border p-8 shadow-2xl max-w-3xl mx-auto relative overflow-hidden group hover:border-glass-border/80 transition-all">
          {isParsing && (
            <div className="absolute inset-0 z-50 bg-cosmos-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
              <Loader2 className="animate-spin text-nebula-500 w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">正在智能识别简历内容</h3>
              <p className="text-aurora-400 font-mono text-sm">{parseStatus}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
             <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
               <BrainCircuit className="text-nebula-500" /> 学员简历数据源
             </label>
             <div className="flex gap-2">
               <input 
                 type="file" 
                 ref={fileInputRef}
                 onChange={handleFileUpload} 
                 className="hidden" 
                 accept=".pdf,.docx,.doc,image/png,image/jpeg,image/jpg"
               />
               <Button 
                 variant="outline" 
                 onClick={() => fileInputRef.current?.click()}
                 className="text-xs py-1 h-8 bg-cosmos-800 hover:bg-nebula-600/20 border-dashed border-slate-600 hover:border-nebula-500/50"
               >
                 <Upload size={14} className="mr-2" /> 上传文件 (PDF/Word/图)
               </Button>
             </div>
          </div>
          
          <div className="relative group/textarea">
            <textarea
              className="relative w-full h-64 p-6 text-sm bg-cosmos-950 border border-glass-border rounded-lg focus:ring-1 focus:ring-nebula-500 focus:border-nebula-500 focus:outline-none resize-none text-slate-300 placeholder-slate-700 font-mono leading-relaxed transition-colors hover:bg-cosmos-900"
              placeholder="支持点击右上角上传文件，或直接在此粘贴简历文本...&#10;支持格式：PDF, Word, JPG, PNG"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
          
          <div className="mt-8">
             <Button 
                variant="primary" 
                onClick={startMatching} 
                disabled={!resumeText.trim()}
                className="w-full py-4 text-lg tracking-widest font-bold shadow-nebula-500/20"
             >
               启动快速匹配
             </Button>
          </div>
        </div>
      )}

      {isLoaderActive && (
        <div className="max-w-2xl mx-auto mt-20">
          <HolographicLoader onComplete={onAnimationComplete} />
        </div>
      )}

      {showResults && (
        <div className="animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 border-b border-glass-border pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-amber-400" /> 匹配分析报告
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-500 text-sm font-mono">
                  当前展示: <span className="text-white font-bold">{batchIndex * BATCH_SIZE + 1} - {Math.min((batchIndex + 1) * BATCH_SIZE, allMatches.length)}</span> 
                  <span className="mx-2 text-slate-700">|</span> 
                  总匹配: <span className="text-aurora-400 font-bold">{allMatches.length}</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-end">
              {allMatches.length > BATCH_SIZE && (
                 <Button 
                   variant="outline" 
                   onClick={handleNextBatch} 
                   className="text-xs border-nebula-500/20 hover:border-nebula-500/50 hover:bg-nebula-500/10 text-nebula-300"
                 >
                   <Shuffle size={14} className="mr-2" /> 换一批岗位
                 </Button>
              )}
               <Button variant="outline" onClick={handleExport} className="text-xs group border-green-500/20 hover:border-green-500/50 hover:bg-green-500/10">
                <FileSpreadsheet size={14} className="mr-2 text-green-400" /> 导出当前 Excel
              </Button>
              <Button variant="secondary" onClick={() => { setShowResults(false); setResumeText(''); }} className="text-xs">
                <RefreshCw size={14} className="mr-2" /> 开启新一轮
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {displayedMatches.map((match, idx) => {
              return (
                <div 
                  key={`${match.jobId}-${idx}`}
                  style={{ animationDelay: `${idx * 0.03}s` }}
                  className="bg-cosmos-900/40 backdrop-blur-md rounded-xl border border-glass-border p-5 hover:bg-cosmos-900/60 hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden animate-slideUp fill-mode-backwards"
                >
                  {/* 左侧匹配度指示条 */}
                  <div 
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${
                      match.matchScore >= 90 ? 'bg-gradient-to-b from-nebula-500 to-aurora-500' : 'bg-slate-700'
                    }`} 
                  />

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 pl-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white group-hover:text-aurora-400 transition-colors">
                          {match.company}
                        </h3>
                        <span className="flex items-center gap-1 text-slate-400 font-mono text-xs bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          <MapPin size={10} />
                          {match.location}
                        </span>
                      </div>

                      <div className="text-slate-300 font-medium text-base flex items-center gap-2">
                        <Building2 size={14} className="text-slate-500" />
                        <span>{match.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-mono mb-0.5 uppercase tracking-wider">匹配度</div>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-nebula-400 to-aurora-400 font-mono">
                            {match.matchScore}%
                        </div>
                      </div>
                      
                      <a 
                        href={match.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group/btn relative inline-flex items-center justify-center gap-2 bg-white text-cosmos-950 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-nebula-400 hover:text-white transition-all shadow-lg shadow-white/10"
                      >
                        立即投递 <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 底部翻页提示 */}
          {allMatches.length > BATCH_SIZE && (
            <div className="mt-8 text-center">
              <Button 
                   variant="ghost" 
                   onClick={handleNextBatch} 
                   className="text-slate-500 hover:text-nebula-400"
                 >
                   <Shuffle size={14} className="mr-2" /> 
                   看不中？换下一批 ({Math.min((batchIndex + 1) * BATCH_SIZE, allMatches.length)} / {allMatches.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
