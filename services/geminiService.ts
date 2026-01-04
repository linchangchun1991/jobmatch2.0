
import { Job, MatchResult } from "../types";

/**
 * Fisher-Yates 随机洗牌算法
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 本地快速匹配引擎
 * 仅基于关键词和规则打分，不再生成文本理由
 */
export const quickLocalMatch = (resumeText: string, jobs: Job[]): MatchResult[] => {
  if (!jobs || jobs.length === 0) return [];

  console.log("[LocalEngine] 启动极速匹配...");

  // 1. 简单的关键词提取
  const lowerResume = resumeText.toLowerCase();
  // 匹配中英文单词
  const tokens = lowerResume.match(/[a-zA-Z]{2,}|[\u4e00-\u9fa5]{2,}/g) || [];
  const tokenCounts: Record<string, number> = {};
  tokens.forEach(t => { tokenCounts[t] = (tokenCounts[t] || 0) + 1; });
  
  // 过滤停用词，提取前 15 个高频词
  const topKeywords = Object.entries(tokenCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([k]) => k.length > 1 && !['com', 'the', 'and', 'with', 'for', '公司', '工作', '负责', '项目', '熟悉', '掌握', '经验', '能力', '我们', '这个'].includes(k))
    .slice(0, 15)
    .map(k => k[0]);

  // 2. 随机打乱岗位，避免每次顺序一样
  const shuffledJobs = shuffleArray(jobs);

  // 3. 评分逻辑
  const scoredJobs = shuffledJobs.map(job => {
    let score = 0;
    const combinedText = (job.roles + " " + job.company + " " + job.location).toLowerCase();
    
    // 关键词命中加分
    topKeywords.forEach(k => {
      if (combinedText.includes(k)) {
        score += 10;
      }
    });

    // 简历前部内容模糊匹配加分
    if (combinedText.includes(lowerResume.slice(0, 10))) score += 5; 

    // 新岗位加分 (3天内)
    const daysOld = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 3600 * 24);
    if (daysOld < 3) score += 25;
    else if (daysOld < 7) score += 10;
    
    // 随机因子 (让分数看起来更自然)
    score += Math.floor(Math.random() * 15);

    return { job, score };
  });

  // 4. 排序
  scoredJobs.sort((a, b) => b.score - a.score);
  
  // 5. 返回所有结果 (由前端控制显示数量)
  return scoredJobs.map(item => ({
    jobId: item.job.id,
    company: item.job.company,
    role: item.job.roles,
    location: item.job.location,
    link: item.job.link,
    // 归一化分数到 85-99 之间
    matchScore: Math.min(99, 85 + Math.floor(item.score % 15))
  }));
};
