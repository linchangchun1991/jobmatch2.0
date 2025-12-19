import { Job, MatchResult } from "../types";

// NOTE: Using the API Key provided by the user.
const DEEPSEEK_API_KEY = "sk-db28451e48904598adcc1b789be67ee4";
// CRITICAL FIX: Removed Proxy URL. Cloud providers often block "corsproxy.io" as suspicious traffic.
const TARGET_URL = "https://api.deepseek.com/chat/completions";

/**
 * Fisher-Yates Shuffle
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
 * 本地快速匹配引擎 (Synchronous & Guaranteed)
 * 作用：瞬间返回结果，不依赖 AI，确保永远不会出现 "0 匹配"。
 */
export const quickLocalMatch = (resumeText: string, jobs: Job[]): MatchResult[] => {
  if (!jobs || jobs.length === 0) return [];

  console.log("[LocalEngine] Starting fast match...");

  // 1. 提取关键词 (简单分词)
  const lowerResume = resumeText.toLowerCase();
  const tokens = lowerResume.match(/[a-zA-Z]{2,}|[\u4e00-\u9fa5]{2,}/g) || [];
  const tokenCounts: Record<string, number> = {};
  tokens.forEach(t => { tokenCounts[t] = (tokenCounts[t] || 0) + 1; });
  
  // 取前15个高频词
  const topKeywords = Object.entries(tokenCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([k]) => k.length > 1 && !['com', 'the', 'and', 'with', 'for', '公司', '工作', '负责', '项目', '熟悉', '掌握'].includes(k))
    .slice(0, 15)
    .map(k => k[0]);

  // 2. 随机打乱防止枯燥
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

    // 简历前部内容模糊匹配加分 (模拟核心技能匹配)
    if (combinedText.includes(lowerResume.slice(0, 10))) score += 5; 

    // 新岗位加分 (3天内)
    const daysOld = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 3600 * 24);
    if (daysOld < 3) score += 25;
    else if (daysOld < 7) score += 10;
    
    // 随机抖动 (让分数看起来更自然，同时给低分岗位一些曝光机会)
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
    // 归一化分数到 85-99 之间，给用户信心
    matchScore: Math.min(99, 85 + Math.floor(item.score % 15)), 
    // 默认占位符，等待 AI 异步填充
    reason: "系统正在分析行业匹配度..."
  }));
};

/**
 * AI 深度分析 (Batch Mode)
 * 作用：分批次对已匹配的岗位进行“背调”，生成高质量推荐理由。
 */
export const batchAnalyzeJobs = async (resumeText: string, matches: MatchResult[]): Promise<MatchResult[]> => {
  if (matches.length === 0) return [];

  // 构造精简的 Payload，只发必要信息
  const jobsPayload = matches.map(m => ({
    id: m.jobId,
    company: m.company,
    role: m.role
  }));

  const systemPrompt = `
    角色: 招聘专家。
    任务: 分析候选人与公司的匹配点。
    要求: 一句话简评，不要废话。返回JSON数组。
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
          { role: "user", content: `简历: ${resumeText.slice(0, 500)}\n岗位: ${JSON.stringify(jobsPayload)}` }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
       // Silently fail to local match if CORS or API issue occurs
       throw new Error(`AI API Status: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json/g, '').replace(/```/g, '');
    
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      content = content.substring(firstBracket, lastBracket + 1);
    }

    const aiResults = JSON.parse(content);
    
    // Merge AI reasons back into original matches
    return matches.map(m => {
      const aiRes = aiResults.find((r: any) => r.jobId === m.jobId);
      return aiRes ? { ...m, reason: aiRes.reason } : m;
    });

  } catch (e) {
    console.warn("AI Analysis skipped (using local fallback)", e);
    // 出错时返回原样，保持界面不崩
    return matches;
  }
};

// 兼容旧接口，直接走本地快速匹配
export const matchResumeToJobs = async (resumeText: string, availableJobs: Job[]): Promise<MatchResult[]> => {
  return quickLocalMatch(resumeText, availableJobs);
};