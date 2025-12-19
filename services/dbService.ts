import { Job } from '../types';
import { supabase } from '../lib/supabaseClient';

export const dbService = {
  getJobs: async (): Promise<Job[]> => {
    try {
      // 从 Supabase 的 'jobs' 表里获取所有数据
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false }); // 按时间倒序

      if (error) {
        console.error("[Supabase] 获取数据失败:", JSON.stringify(error, null, 2));
        alert(`数据库连接出错: ${error.message}\n错误代码: ${error.code}\n请联系管理员检查 Supabase 配置。`);
        return [];
      }

      console.log(`[Supabase] 成功加载 ${data?.length || 0} 个岗位`);
      return (data || []) as Job[];
    } catch (e: any) {
      console.error("[DB] 网络异常:", e);
      alert("网络请求异常: " + (e.message || "未知错误，请检查网络连接"));
      return [];
    }
  },

  insertJobs: async (jobs: Job[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('jobs')
        .insert(jobs);

      if (error) {
        console.error("[Supabase] 插入详细错误:", JSON.stringify(error, null, 2));
        
        let tip = "";
        if (error.code === '42501') {
          tip = "\n[提示] 权限拒绝。请联系管理员检查 RLS 策略。";
        } else if (error.code === '42P01') {
           tip = "\n[提示] 表不存在。数据库尚未初始化 jobs 表。";
        } else if (error.code === '23505') {
           tip = "\n[提示] 数据重复。部分岗位 ID 已存在。";
        }

        alert(`保存失败: ${error.message}\n代码: ${error.code}${tip}`);
        return false;
      } else {
        console.log(`[Supabase] 成功上传 ${jobs.length} 个岗位`);
        alert(`成功入库 ${jobs.length} 个岗位！`);
        return true;
      }
    } catch (e: any) {
      console.error("[DB] 插入异常:", e);
      alert("保存时发生未知错误: " + (e.message || "请检查控制台"));
      return false;
    }
  },

  deleteAllJobs: async (): Promise<boolean> => {
    try {
      // 删除所有非空 ID 的数据
      const { error, count } = await supabase
        .from('jobs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

      if (error) {
        console.error("[Supabase] 删除失败:", error);
        alert(`清空失败: ${error.message}`);
        return false;
      }
      
      console.log(`[Supabase] 已删除 ${count} 条数据`);
      return true;
    } catch (e: any) {
      console.error("[DB] 删除异常:", e);
      alert("删除操作发生异常");
      return false;
    }
  }
};