
import { Job } from '../types';

// 架构升级：Cloudflare Pages Functions 接口
// 自动支持离线模式 (Offline Fallback)
const API_BASE_URL = "";
const STORAGE_KEY = 'highmark_jobs_cache_v1';

export const dbService = {
  getJobs: async (): Promise<Job[]> => {
    let cloudData: Job[] | null = null;
    
    // 1. 尝试从云端获取数据
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs`);
      if (response.ok) {
        cloudData = await response.json();
        
        // 成功获取后，静默更新本地缓存作为备份
        if (cloudData && Array.isArray(cloudData)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            console.log(`[System] 云端同步成功，已缓存 ${cloudData.length} 条数据`);
        }
      } else {
        console.warn(`[System] 云端服务不可用 (Status: ${response.status})，准备切换本地模式`);
      }
    } catch (e) {
      console.warn("[System] 网络连接异常，切换至离线模式");
    }

    // 2. 如果云端获取失败（或未配置数据库），回退读取本地缓存
    if (cloudData && Array.isArray(cloudData)) {
        return cloudData;
    }

    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
        console.log("[System] 已启用本地离线数据源");
        try {
            return JSON.parse(localData);
        } catch(e) {
            return [];
        }
    }

    return [];
  },

  insertJobs: async (jobs: Job[]): Promise<boolean> => {
    let success = false;

    // 1. 乐观 UI 更新：优先写入本地缓存，确保用户感觉"立即成功"
    try {
        const currentCacheRaw = localStorage.getItem(STORAGE_KEY);
        const currentCache: Job[] = currentCacheRaw ? JSON.parse(currentCacheRaw) : [];
        // 将新数据合并到缓存头部
        const updatedCache = [...jobs, ...currentCache];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCache));
    } catch (e) {
        console.error("本地缓存写入失败:", e);
    }

    // 2. 尝试发送到云端
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobs)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      console.log(`[System] 数据已成功同步至云端`);
      success = true;
      return true;

    } catch (e: any) {
      console.error("[System] 云端同步失败:", e);
      // 虽然云端失败，但本地已保存，告知用户
      alert("⚠️ 注意：云端数据库连接失败。\n\n数据已安全保存在您的本地浏览器中 (离线模式)。\n您仍可正常使用匹配功能，但数据仅在当前设备可见。");
      return true; // 对前端 UI 来说，视为操作成功（因为数据已保存）
    }
  },

  deleteAllJobs: async (): Promise<boolean> => {
    // 1. 清空本地
    localStorage.removeItem(STORAGE_KEY);
    
    // 2. 尝试清空云端
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Cloud delete failed");
      return true;
    } catch (e) {
      console.warn("[System] 仅清空了本地数据，云端可能未连接");
      return true;
    }
  }
};
