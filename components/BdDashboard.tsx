
import React, { useState, useEffect } from 'react';
import { parseJobText } from '../utils/jobParser';
import { Job, ParseResult } from '../types';
import { dbService } from '../services/dbService';
import { Button } from './ui/Button';
import { UploadCloud, AlertCircle, CheckCircle2, Database, Terminal, FileCode, Trash2, Save } from 'lucide-react';

export const BdDashboard: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [parsedJobs, setParsedJobs] = useState<ParseResult[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dbCount, setDbCount] = useState(0);

  useEffect(() => {
    refreshDbCount();
  }, []);

  const refreshDbCount = async () => {
    const jobs = await dbService.getJobs();
    setDbCount(jobs.length);
  };

  const handleParse = () => {
    setIsParsing(true);
    setTimeout(() => {
      const results = parseJobText(inputText);
      setParsedJobs(results);
      setIsParsing(false);
      setIsSaved(false);
    }, 150);
  };

  const handleAppend = async () => {
    const validJobs = parsedJobs.filter(r => r.valid && r.data).map(r => r.data!) as Job[];
    if (validJobs.length === 0) return;
    
    setIsSaving(true);
    const success = await dbService.insertJobs(validJobs);
    setIsSaving(false);

    if (success) {
      setIsSaved(true);
      setInputText('');
      setParsedJobs([]);
      refreshDbCount();
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm("【严重警告】此操作将永久清空数据库中所有岗位数据！\n\n此操作不可撤销。\n确定要继续吗？");
    if (confirmed) {
      const success = await dbService.deleteAllJobs();
      if (success) {
        alert("数据库已重置。");
        refreshDbCount();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-glass-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="text-aurora-500" />
            岗位智能清洗引擎
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
            Raw Data Processor: 粘贴非结构化文本，系统自动执行 ETL 清洗并存入云端数据库。
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <Button 
             variant="danger" 
             onClick={handleClearAll}
             className="text-xs h-9 px-3"
             disabled={dbCount === 0}
          >
             <Trash2 size={14} className="mr-2" />
             清空库存
          </Button>
          <div className="bg-cosmos-800 border border-glass-border px-5 py-2 rounded-lg flex items-center gap-3 shadow-lg hover:border-aurora-500/30 transition-colors">
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">岗位库总数</span>
                <span className="text-xl font-mono font-bold text-aurora-400">{dbCount}</span>
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
        {/* Input Area */}
        <div className="bg-cosmos-900/50 backdrop-blur-md rounded-xl border border-glass-border flex flex-col h-full overflow-hidden shadow-2xl transition-all hover:border-glass-border/80">
          <div className="bg-cosmos-950/50 border-b border-glass-border p-4 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Terminal size={16} className="text-nebula-500" />
              原始数据录入
            </label>
            <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-1 rounded border border-white/5">推荐分隔符: " | "</span>
          </div>
          
          <div className="relative flex-1 bg-cosmos-950">
            <textarea
              className="w-full h-full p-6 text-sm font-mono bg-transparent text-slate-300 border-none focus:ring-0 resize-none leading-relaxed placeholder-slate-700 custom-scrollbar focus:bg-cosmos-900/30 transition-colors"
              placeholder={`// 请在此粘贴原始招聘信息...\n// 智能识别格式: 公司名称 | 岗位名称 | 工作地点 | 投递链接\n\n示例数据:\n字节跳动 | 高级前端工程师 | 北京 | https://jobs.bytedance.com/...\n腾讯 | 游戏运营 | 深圳 | https://careers.tencent.com/...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              spellCheck={false}
            />
          </div>
          
          <div className="p-4 border-t border-glass-border bg-cosmos-900 flex justify-end">
            <Button onClick={handleParse} disabled={!inputText || isParsing} isLoading={isParsing} className="w-full md:w-auto shadow-nebula-500/20">
              <FileCode size={16} className="mr-2" /> 执行清洗与解析
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="bg-cosmos-900/50 backdrop-blur-md rounded-xl border border-glass-border flex flex-col h-full overflow-hidden shadow-2xl transition-all hover:border-glass-border/80">
          <div className="bg-cosmos-950/50 border-b border-glass-border p-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
               <CheckCircle2 size={16} className="text-aurora-500" />
               解析结果预览
            </h2>
            {parsedJobs.length > 0 && (
               <div className="text-xs font-mono font-bold px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                 待入库: {parsedJobs.filter(j => j.valid).length}
               </div>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-cosmos-900 scrollbar-hide">
            {parsedJobs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                <div className="p-4 rounded-full bg-white/5">
                    <UploadCloud size={40} className="opacity-40" />
                </div>
                <p className="text-sm font-mono">等待数据解析...</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-cosmos-950 text-slate-500 font-mono text-xs sticky top-0 z-10 shadow-sm backdrop-blur-sm bg-opacity-90">
                  <tr>
                    <th className="px-5 py-3 font-normal w-16">检测</th>
                    <th className="px-5 py-3 font-normal">公司主体</th>
                    <th className="px-5 py-3 font-normal">岗位详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {parsedJobs.map((item, idx) => (
                    <tr key={idx} className={`group transition-colors ${item.valid ? 'hover:bg-white/5' : 'bg-red-900/10 hover:bg-red-900/20'}`}>
                      <td className="px-5 py-3">
                        {item.valid ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-200">
                        {item.valid ? item.data?.company : <span className="text-red-400 text-xs font-mono">字段缺失</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-400 truncate max-w-[200px]">
                        {item.valid ? item.data?.roles : <span className="text-slate-600 font-mono text-xs">{item.rawLine}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-glass-border bg-cosmos-900 flex justify-between items-center">
             {isSaved ? (
               <span className="text-green-400 text-sm font-medium flex items-center gap-2 animate-fadeIn">
                 <CheckCircle2 size={16} /> 数据已同步至云端
               </span>
             ) : (
               <span className="text-xs text-slate-500 font-mono">系统就绪</span>
             )}
            <Button 
              variant="secondary" 
              onClick={handleAppend} 
              disabled={parsedJobs.filter(p => p.valid).length === 0 || isSaving}
              isLoading={isSaving}
              className="shadow-aurora-500/10"
            >
              <Save size={16} className="mr-2" />
              确认并入库
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
