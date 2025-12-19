import { Job, ParseResult } from '../types';

// Robust ID generator that works in both Secure (HTTPS) and Insecure contexts
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if crypto.randomUUID fails
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
    // Remove query parameters often used for tracking (wxwork, utm, etc.)
    // We strictly return origin + pathname to be safe
    return urlObj.origin + urlObj.pathname;
  } catch (e) {
    // If invalid URL, return original trimmed
    return url.trim();
  }
};

export const parseJobText = (text: string): ParseResult[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  return lines.map(line => {
    // Expected format: Company | Roles | Location | Link
    const parts = line.split('|').map(p => p.trim());

    if (parts.length < 4) {
      return {
        valid: false,
        rawLine: line,
        error: '格式错误。正确格式：公司 | 职位 | 地点 | 链接'
      };
    }

    // Basic extraction
    const [company, roles, location, rawLink] = parts;
    
    // Validation
    if (!company || !roles || !location || !rawLink) {
       return {
        valid: false,
        rawLine: line,
        error: '检测到空字段，请检查输入。'
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