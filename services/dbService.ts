
import { Job } from '../types';

// ⚠️ 重要：部署完 Cloudflare Worker 后，将获得的 URL 填入此处
// 例如: "https://highmark-api.yourname.workers.dev"
// 如果本地开发，通常不需要变，或者填入本地测试地址
// Fix: Cast import.meta to any to resolve TS error: Property 'env' does not exist on type 'ImportMeta'.
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || "PLEASE_REPLACE_WITH_YOUR_WORKER_URL";

export const dbService = {
  getJobs: async (): Promise<Job[]> => {
    try {
      if (API_BASE_URL.includes("PLEASE_REPLACE")) {
        console.warn("API URL 未配置，请在 services/dbService.ts 中填入 Cloudflare Worker 地址");
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/api/jobs`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log(`[D1] 成功加载 ${data.length} 个岗位`);
      return data;
    } catch (e: any) {
      console.error("[DB] 获取数据失败:", e);
      alert("无法连接到 Cloudflare 数据库，请检查 API 配置。");
      return [];
    }
  },

  insertJobs: async (jobs: Job[]): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobs)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      console.log(`[D1] 成功上传 ${jobs.length} 个岗位`);
      alert(`成功入库 ${jobs.length} 个岗位！`);
      return true;
    } catch (e: any) {
      console.error("[DB] 插入异常:", e);
      alert("保存失败: " + e.message);
      return false;
    }
  },

  deleteAllJobs: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error("Delete failed");
      
      console.log(`[D1] 数据库已清空`);
      return true;
    } catch (e: any) {
      console.error("[DB] 删除异常:", e);
      alert("清空数据库失败");
      return false;
    }
  }
};