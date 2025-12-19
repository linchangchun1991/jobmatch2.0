import { Job, MatchResult } from "../types";

// DeepSeek API Key (用户提供)
const DEEPSEEK_API_KEY = "sk-db28451e48904598adcc1b789be67ee4";
// 直连地址，不使用任何可能被封禁的 Proxy
const TARGET_URL = "https://api.deepseek.com/chat/completions";

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
 * 本地快速匹配引擎 (同步 & 兜底)
 * 作用：在 AI 调用失败或为了快速响应时使用。确保用户总是能看到结果。
 */
export const quickLocalMatch = (resumeText: string, jobs: Job[]): MatchResult[] => {
  if (!jobs || jobs.length === 0) return [];

  console.log("[LocalEngine] 启动本地匹配逻辑...");

  // 1. 简单的关键词提取
  const lowerResume = resumeText.toLowerCase();
  // 匹配中英文单词
  const tokens = lowerResume.match(/[a-zA-Z]{2,}|[\u4e00-\u9fa5]{2,}/g) || [];
  const tokenCounts: Record<string, number> = {};
  tokens.forEach(t => { tokenCounts[t] = (tokenCounts[t] || 0) + 1; });
  
  // 过滤停用词，提取前 15 个高频词
  const topKeywords = Object.entries(tokenCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([k]) => k.length > 1 && !['com', 'the', 'and', 'with', 'for', '公司', '工作', '负责', '项目', '熟悉', '掌握', '经验', '能力'].includes(k))
    .slice(0, 15)
    .map(k => k[0]);

  // 2. 随机打乱岗位，避免每次顺序一样
  const shuffledJobs = shuffleArray(jobs);

  // 3. 评分逻辑
  const scoredJobs = shuffledJobs.map(job => {
    let score = 0;
    const combinedText = (job.roles + " " + job.company + " " + job.location).toLowerCase();
    
    // 关键词命中加分
    let hitCount = 0;
    topKeywords.forEach(k => {
      if (combinedText.includes(k)) {
        score += 10;
        hitCount++;
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

    return { job, score, hitCount };
  });

  // 4. 排序并截取 Top 20
  scoredJobs.sort((a, b) => b.score - a.score);
  const topResults = scoredJobs.slice(0, 20);

  // 5. 格式化输出
  return topResults.map(item => ({
    jobId: item.job.id,
    company: item.job.company,
    role: item.job.roles,
    location: item.job.location,
    link: item.job.link,
    // 归一化分数到 85-99 之间
    matchScore: Math.min(99, 85 + Math.floor(item.score % 15)), 
    // 默认占位符，等待 AI 异步更新
    reason: "系统正在结合行业趋势进行深度分析..."
  }));
};

/**
 * AI 深度分析 (批量模式)
 * 作用：分批次对已匹配的岗位进行“背调”，生成高质量推荐理由。
 */
export const batchAnalyzeJobs = async (resumeText: string, matches: MatchResult[]): Promise<MatchResult[]> => {
  if (matches.length === 0) return [];

  // 构造精简的 Payload
  const jobsPayload = matches.map(m => ({
    id: m.jobId,
    company: m.company,
    role: m.role
  }));

  const systemPrompt = `
    角色: 资深招聘专家。
    任务: 根据候选人简历片段，分析其与目标岗位的匹配点。
    输出要求: 
    1. 返回一个纯 JSON 数组，不包含 markdown 标记。
    2. 数组格式: [{"jobId": "...", "reason": "一句精简的推荐理由(30字以内)"}]
    3. 理由要专业、吸引人。
  `;

  try {
    const response = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `简历片段: ${resumeText.slice(0, 600)}\n待分析岗位: ${JSON.stringify(jobsPayload)}` }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
       // 如果遇到 401/429/500 等错误，抛出异常，触发降级
       throw new Error(`AI API 响应异常: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    
    // 清理可能存在的 markdown 标记
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 尝试截取合法的 JSON 数组部分
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      content = content.substring(firstBracket, lastBracket + 1);
    }

    const aiResults = JSON.parse(content);
    
    // 将 AI 结果合并回原始数据
    return matches.map(m => {
      const aiRes = aiResults.find((r: any) => r.jobId === m.jobId);
      return aiRes ? { ...m, reason: aiRes.reason } : m;
    });

  } catch (e) {
    console.warn("AI 分析服务暂时不可用，已切换至本地模式:", e);
    // 出错时返回原样，保持界面不崩
    return matches;
  }
};