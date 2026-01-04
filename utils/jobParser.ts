
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
    let parts: string[] = [];
    
    // 策略1: 尝试用竖线 "|" 分隔 (原有格式)
    const pipeParts = line.split('|').map(p => p.trim());
    
    // 策略2: 尝试用制表符 Tab 分隔 (Excel/飞书表格直接复制的格式)
    const tabParts = line.split('\t').map(p => p.trim());

    // 决策逻辑：优先使用切分出更多有效字段的策略
    if (tabParts.length >= 4) {
      parts = tabParts;
    } else if (pipeParts.length >= 4) {
      parts = pipeParts;
    } else {
      // 策略3: 尝试多个空格分隔 (兜底)
      const spaceParts = line.split(/\s{2,}/).map(p => p.trim());
      if (spaceParts.length >= 4) {
        parts = spaceParts;
      } else {
        parts = pipeParts; // 默认回退到竖线
      }
    }

    if (parts.length < 4) {
      return {
        valid: false,
        rawLine: line,
        error: '格式识别失败。请检查是否包含：公司、职位、地点、链接 (支持 Excel 直接复制)'
      };
    }

    // 提取前4个字段，忽略多余的
    const [company, roles, location, rawLink] = parts;
    
    // 校验
    if (!company || !roles || !location || !rawLink) {
       return {
        valid: false,
        rawLine: line,
        error: '检测到空字段，请检查表格是否存在空单元格。'
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
