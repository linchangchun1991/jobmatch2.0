
import { Job } from '../types';

// Cloudflare Pages Functions 接口
// 留空表示使用当前域名的相对路径 (/api/jobs)
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
            // console.log(`[System] 云端同步成功，已缓存 ${cloudData.length} 条数据`);
        }
      } 
    } catch (e) {
      console.warn("[System] 网络连接抖动，尝试读取本地缓存");
    }

    // 2. 如果云端获取失败（或未配置数据库），回退读取本地缓存
    if (cloudData && Array.isArray(cloudData)) {
        return cloudData;
    }

    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
        console.log("[System] 已启用本地缓存数据源");
        try {
            return JSON.parse(localData);
        } catch(e) {
            return [];
        }
    }

    return [];
  },

  insertJobs: async (jobs: Job[]): Promise<boolean> => {
    // 1. 乐观 UI 更新：优先写入本地缓存
    try {
        const currentCacheRaw = localStorage.getItem(STORAGE_KEY);
        const currentCache: Job[] = currentCacheRaw ? JSON.parse(currentCacheRaw) : [];
        const updatedCache = [...jobs, ...currentCache];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCache));
    } catch (e) {
        console.error("本地缓存写入失败:", e);
    }

    // 2. 发送到云端
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobs)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return true;

    } catch (e: any) {
      console.error("[System] 云端同步失败:", e);
      alert("⚠️ 网络连接不稳定\n\n数据已保存在本地，但在恢复网络前其他用户可能无法立即看到新岗位。");
      return true;
    }
  },

  deleteAllJobs: async (): Promise<boolean> => {
    localStorage.removeItem(STORAGE_KEY);
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Cloud delete failed");
      return true;
    } catch (e) {
      return true;
    }
  }
};
