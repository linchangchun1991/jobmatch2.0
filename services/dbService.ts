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
        // 增加错误提示，帮助新手定位问题
        alert(`数据库连接出错: ${error.message}\nCode: ${error.code}\n请检查 Supabase Key 是否正确，或是否已创建 jobs 表。`);
        return [];
      }

      console.log(`[Supabase] 成功加载 ${data?.length || 0} 个岗位`);
      return (data || []) as Job[];
    } catch (e: any) {
      console.error("[DB] 网络异常:", e);
      alert("网络请求异常: " + (e.message || "未知错误，请检查控制台"));
      return [];
    }
  },

  insertJobs: async (jobs: Job[]): Promise<boolean> => {
    try {
      // 这里的 jobs 数组字段必须和数据库里的列名一一对应
      const { error } = await supabase
        .from('jobs')
        .insert(jobs);

      if (error) {
        console.error("[Supabase] 插入详细错误:", JSON.stringify(error, null, 2));
        
        let tip = "";
        if (error.code === '42501') {
          tip = "\n[提示] 权限拒绝 (RLS Policy Violation)。请在 Supabase 后台 'Table Editor' -> 'jobs' -> 'RLS' 中关闭 RLS，或添加允许 anon (public) 角色 INSERT 的策略。";
        } else if (error.code === '42P01') {
           tip = "\n[提示] 表不存在。请确保在 Supabase 创建了名为 'jobs' 的表。";
        } else if (error.code === '23505') {
           tip = "\n[提示] ID 重复。请勿重复提交相同的数据。";
        } else if (error.message.includes("column")) {
           tip = "\n[提示] 数据库表结构不匹配，请检查字段名是否与代码一致 (raw_text, company, roles, location, link, id)。";
        }

        alert(`保存失败: ${error.message}\nCode: ${error.code}${tip}`);
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
      // Supabase delete requires a where clause.
      // Assuming 'id' is a UUID and never equals '0000', this deletes all rows.
      // Alternatively, use a not-equal filter on a known column.
      const { error, count } = await supabase
        .from('jobs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all valid UUIDs

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