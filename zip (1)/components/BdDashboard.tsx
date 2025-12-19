import React, { useState, useEffect } from 'react';
import { parseJobText } from '../utils/jobParser';
import { Job, ParseResult } from '../types';
import { dbService } from '../services/dbService';
import { Button } from './ui/Button';
import { ClipboardList, UploadCloud, AlertCircle, CheckCircle2, Database, Terminal, FileCode, Trash2, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const BdDashboard: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [parsedJobs, setParsedJobs] = useState<ParseResult[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // 新增：保存加载状态
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
    }, 400);
  };

  const handleAppend = async () => {
    // 1. 获取有效数据
    const validJobs = parsedJobs.filter(r => r.valid && r.data).map(r => r.data!) as Job[];
    if (validJobs.length === 0) return;
    
    // 2. 开启 Loading，禁用按钮，防止连点 (Fix duplicate key error)
    setIsSaving(true);
    
    // 3. 执行插入，等待结果
    const success = await dbService.insertJobs(validJobs);
    
    // 4. 关闭 Loading
    setIsSaving(false);

    // 5. 只有成功才清空表单，失败则保留以便用户检查
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
        alert("数据库已清空。");
        refreshDbCount();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-end border-b border-glass-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="text-aurora-500" />
            岗位智能清洗引擎
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl">
            Raw Data Processor: 粘贴非结构化文本，系统自动执行 ETL 清洗并存入 Supabase 云端。
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
             variant="danger" 
             onClick={handleClearAll}
             className="text-xs h-9 px-3"
             disabled={dbCount === 0}
          >
             <Trash2 size={14} className="mr-2" />
             清空所有库存
          </Button>
          <div className="bg-cosmos-800 border border-glass-border px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg">
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-mono">岗位库总数</span>
                <span className="text-xl font-mono font-bold text-aurora-400">{dbCount}</span>
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
        {/* Input Area - Code Editor Style */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-cosmos-900/50 backdrop-blur-md rounded-xl border border-glass-border flex flex-col h-full overflow-hidden shadow-2xl"
        >
          <div className="bg-cosmos-950/50 border-b border-glass-border p-3 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Terminal size={16} className="text-nebula-500" />
              原始数据输入
            </label>
            <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-1 rounded">分割符: " | "</span>
          </div>
          
          <div className="relative flex-1 bg-cosmos-950">
            <textarea
              className="w-full h-full p-4 text-sm font-mono bg-transparent text-slate-300 border-none focus:ring-0 resize-none leading-relaxed placeholder-slate-700 custom-scrollbar"
              placeholder={`// 请在此粘贴原始数据...\n// 格式: 公司 | 职位 | 地点 | 链接\n\n4399 | 产品经理 | 广州 | https://mp.weixin.qq.com/s/...\n腾讯 | 游戏策划 | 深圳 | https://...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              spellCheck={false}
            />
          </div>
          
          <div className="p-4 border-t border-glass-border bg-cosmos-900 flex justify-end">
            <Button onClick={handleParse} disabled={!inputText || isParsing} isLoading={isParsing} className="w-full md:w-auto">
              执行清洗解析
            </Button>
          </div>
        </motion.div>

        {/* Preview Area - Data Grid Style */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-cosmos-900/50 backdrop-blur-md rounded-xl border border-glass-border flex flex-col h-full overflow-hidden shadow-2xl"
        >
          <div className="bg-cosmos-950/50 border-b border-glass-border p-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
               <FileCode size={16} className="text-aurora-500" />
               清洗结果预览
            </h2>
            {parsedJobs.length > 0 && (
               <div className="text-xs font-mono font-bold px-2 py-1 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                 待入库: {parsedJobs.filter(j => j.valid).length}
               </div>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-cosmos-900 scrollbar-hide">
            {parsedJobs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <UploadCloud size={64} className="mb-4 opacity-20" />
                <p className="text-sm font-mono">等待数据输入...</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-cosmos-950 text-slate-500 font-mono text-xs sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-normal w-12">状态</th>
                    <th className="px-4 py-3 font-normal">公司名称</th>
                    <th className="px-4 py-3 font-normal">岗位详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {parsedJobs.map((item, idx) => (
                    <tr key={idx} className={`group transition-colors ${item.valid ? 'hover:bg-white/5' : 'bg-red-900/10 hover:bg-red-900/20'}`}>
                      <td className="px-4 py-3">
                        {item.valid ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {item.valid ? item.data?.company : <span className="text-red-400 text-xs font-mono">格式错误</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">
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
               <span className="text-green-400 text-sm font-medium flex items-center gap-2">
                 <CheckCircle2 size={16} /> 追加成功
               </span>
             ) : (
               <span className="text-xs text-slate-500 font-mono">准备就绪</span>
             )}
            {/* 修复：增加 isLoading 属性，且 disabled 逻辑加入 isSaving */}
            <Button 
              variant="secondary" 
              onClick={handleAppend} 
              disabled={parsedJobs.filter(p => p.valid).length === 0 || isSaving}
              isLoading={isSaving}
            >
              <PlusCircle size={16} className="mr-2" />
              确认并追加入库
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};