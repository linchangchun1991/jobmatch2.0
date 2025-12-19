import React, { useState, useRef } from 'react';
import { HolographicLoader } from './HolographicLoader';
import { dbService } from '../services/dbService';
import { quickLocalMatch, batchAnalyzeJobs } from '../services/geminiService';
import { parseFile } from '../utils/fileParser';
import { MatchResult } from '../types';
import { Button } from './ui/Button';
import { Sparkles, MapPin, ArrowRight, Building2, BrainCircuit, RefreshCw, FileSpreadsheet, Upload, X, Loader2, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';

export const CoachDashboard: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [isLoaderActive, setIsLoaderActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analyzingIndices, setAnalyzingIndices] = useState<number[]>([]);
  
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseStatus('正在启动文件解析引擎...');
    setErrorMsg(null);

    try {
      const text = await parseFile(file, (status) => setParseStatus(status));
      if (!text || text.trim().length < 20) {
        throw new Error('未能从文件中识别出有效文字，请检查文件是否清晰。');
      }
      setResumeText(prev => prev + '\n' + text);
    } catch (err: any) {
      setErrorMsg(`文件解析失败: ${err.message}`);
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
    setResults([]);
    
    try {
      const jobs = await dbService.getJobs();
      if (jobs.length === 0) {
        setErrorMsg("数据库为空：请先联系BD部门录入岗位数据");
        setIsLoaderActive(false);
        return;
      }

      const localMatches = quickLocalMatch(resumeText, jobs);
      
      if (localMatches.length === 0) {
        setErrorMsg("匹配异常：未找到任何岗位，请检查数据库");
        setIsLoaderActive(false);
        return;
      }

      setResults(localMatches);

    } catch (e) {
      setErrorMsg("系统错误：无法连接至核心数据库");
      setIsLoaderActive(false);
    }
  };

  const onAnimationComplete = () => {
    setIsLoaderActive(false);
    setShowResults(true);
    runDeepAnalysis(results);
  };

  const runDeepAnalysis = async (initialMatches: MatchResult[]) => {
    const BATCH_SIZE = 5;
    const total = initialMatches.length;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const end = Math.min(i + BATCH_SIZE, total);
      const batch = initialMatches.slice(i, end);
      
      const currentIndices = Array.from({ length: end - i }, (_, k) => i + k);
      setAnalyzingIndices(prev => [...prev, ...currentIndices]);

      try {
        const enrichedBatch = await batchAnalyzeJobs(resumeText, batch);
        
        setResults(prev => {
          const next = [...prev];
          for (let k = 0; k < enrichedBatch.length; k++) {
             if (next[i + k]) {
               next[i + k] = enrichedBatch[k];
             }
          }
          return next;
        });
      } catch (e) {
        console.error("Batch analysis failed", e);
      } finally {
        setAnalyzingIndices(prev => prev.filter(idx => !currentIndices.includes(idx)));
      }
    }
  };

  const handleExport = () => {
    if (results.length === 0) return;

    const exportData = results.map((r, index) => ({
      "排名": index + 1,
      "公司名称": r.company,
      "工作地点": r.location,
      "匹配岗位": r.role,
      "匹配度": `${r.matchScore}%`,
      "推荐理由": r.reason.replace('⚡️ 海马AI正在联网分析企业行业地位与业务趋势...', '系统推荐'),
      "投递链接": r.link
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wscols = [{wch: 6}, {wch: 20}, {wch: 10}, {wch: 30}, {wch: 8}, {wch: 60}, {wch: 40}];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "岗位匹配表");
    XLSX.writeFile(wb, `海马职加_推荐表_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      {!showResults && !isLoaderActive && (
        <header className="mb-10 text-center">
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">AI 智能人岗匹配中台</h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-nebula-500 to-transparent opacity-50"></div>
          </div>
          <p className="text-slate-400 mt-4 font-mono text-sm">DeepSeek V3 核心已连接 • 支持多模态简历解析</p>
        </header>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-lg font-mono flex items-center justify-center gap-2">
          <X size={16} /> [系统警报] {errorMsg}
        </div>
      )}

      {!isLoaderActive && !showResults && (
        <div className="bg-cosmos-900/60 backdrop-blur-xl rounded-2xl border border-glass-border p-8 shadow-2xl max-w-3xl mx-auto relative overflow-hidden">
          {isParsing && (
            <div className="absolute inset-0 z-50 bg-cosmos-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
              <Loader2 className="animate-spin text-nebula-500 w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">正在智能识别简历</h3>
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
                 className="text-xs py-1 h-8 bg-cosmos-800 hover:bg-nebula-600/20 border-dashed border-slate-600"
               >
                 <Upload size={14} className="mr-2" /> 上传简历 (PDF/Word/图)
               </Button>
             </div>
          </div>
          
          <div className="relative group">
            <textarea
              className="relative w-full h-64 p-6 text-sm bg-cosmos-950 border border-glass-border rounded-lg focus:ring-1 focus:ring-nebula-500 focus:border-nebula-500 focus:outline-none resize-none text-slate-300 placeholder-slate-700 font-mono leading-relaxed"
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
                className="w-full py-4 text-lg tracking-widest font-bold"
             >
               启动 AI 匹配引擎
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
        <div>
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 border-b border-glass-border pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-champagne-500" /> 匹配分析报告
              </h2>
              <p className="text-slate-500 text-sm font-mono mt-1">
                已为您筛选 <span className="text-aurora-400 font-bold">{results.length}</span> 个高匹配岗位
              </p>
            </div>
            
            <div className="flex gap-3">
               <Button variant="outline" onClick={handleExport} className="text-xs group">
                <FileSpreadsheet size={14} className="mr-2 text-green-400 group-hover:text-white" /> 导出专属表格
              </Button>
              <Button variant="secondary" onClick={() => { setShowResults(false); setResumeText(''); }} className="text-xs">
                <RefreshCw size={14} className="mr-2" /> 新的匹配
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {results.map((match, idx) => {
              const isAnalyzing = analyzingIndices.includes(idx);
              const isAiReady = !match.reason.includes("⚡️");

              return (
                <div 
                  key={match.jobId}
                  className="bg-cosmos-900/40 backdrop-blur-md rounded-xl border border-glass-border p-6 hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div 
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      match.matchScore >= 90 ? 'bg-gradient-to-b from-nebula-500 to-aurora-500' : 'bg-slate-700'
                    }`} 
                  />

                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 pl-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-baseline gap-3 mb-1">
                        <h3 className="text-2xl font-bold text-white group-hover:text-aurora-400 transition-colors">
                          {match.company}
                        </h3>
                        <span className="flex items-center gap-1 text-aurora-500/80 font-mono text-sm bg-aurora-500/10 px-2 py-0.5 rounded border border-aurora-500/20">
                          <MapPin size={12} />
                          {match.location}
                        </span>
                      </div>

                      <div className="text-slate-300 font-medium text-base mb-3 flex items-start gap-2">
                        <Building2 size={16} className="mt-1 text-slate-500 shrink-0" />
                        <span className="leading-snug">{match.role}</span>
                      </div>
                      
                      <div className={`bg-cosmos-950/50 border border-white/5 p-4 rounded-lg relative mt-3 transition-colors duration-500 ${isAiReady ? 'border-nebula-500/30 bg-nebula-900/10' : ''}`}>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-500"></div>
                        <span className="text-nebula-400 text-[10px] font-bold uppercase mb-1 flex items-center gap-2 tracking-wider">
                          {isAnalyzing ? (
                             <>
                               <Loader2 size={10} className="animate-spin" /> DeepSeek 深度背调中...
                             </>
                          ) : isAiReady ? (
                             <>
                               <Zap size={10} /> AI 推荐理由 (DeepSeek V3)
                             </>
                          ) : (
                             "系统初步评估"
                          )}
                        </span>
                        
                        <p className={`text-slate-300 text-sm leading-relaxed ${isAnalyzing ? 'animate-pulse' : ''}`}>
                          {match.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 md:gap-6 min-w-[140px]">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase tracking-wider">匹配概率</div>
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-nebula-400 to-aurora-400 flex items-center justify-end gap-1 font-mono">
                            {match.matchScore}<span className="text-lg text-slate-500">%</span>
                        </div>
                      </div>
                      
                      <a 
                        href={match.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group/btn relative inline-flex items-center justify-center w-full md:w-auto gap-2 bg-white text-cosmos-950 px-6 py-3 rounded-lg text-sm font-bold hover:bg-nebula-400 hover:text-white transition-all"
                      >
                        立即投递 <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};