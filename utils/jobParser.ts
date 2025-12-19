import { Job, ParseResult } from '../types';

// 鲁棒的 ID 生成器，适配所有环境
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // 忽略错误，使用 fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const cleanUrl = (url: string): string => {
  try {
    const urlObj = new URL(url.trim());
    // 仅保留 Origin 和 Pathname，去除可能包含追踪参数的 Query String
    return urlObj.origin + urlObj.pathname;
  } catch (e) {
    // 如果 URL 格式不标准，则原样返回
    return url.trim();
  }
};

export const parseJobText = (text: string): ParseResult[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  return lines.map(line => {
    // 期望格式: 公司 | 职位 | 地点 | 链接
    const parts = line.split('|').map(p => p.trim());

    if (parts.length < 4) {
      return {
        valid: false,
        rawLine: line,
        error: '格式错误。标准格式应为：公司 | 职位 | 地点 | 链接'
      };
    }

    // 基础提取
    const [company, roles, location, rawLink] = parts;
    
    // 校验
    if (!company || !roles || !location || !rawLink) {
       return {
        valid: false,
        rawLine: line,
        error: '检测到空字段，请检查输入是否完整。'
      };
    }

    const cleanLink = cleanUrl(rawLink);

    const job: Job = {
      id: generateUUID(),
      company,
      roles,
      location,
      link: cleanLink,
      raw_text: line,
      created_at: new Date().toISOString()
    };

    return {
      valid: true,
      data: job,
      rawLine: line
    };
  });
};