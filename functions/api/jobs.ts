
// Cloudflare D1 and Pages Function types definition
interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  error?: string;
  meta: any;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = unknown>(query: string): Promise<D1Result<T>>;
}

type Params<P extends string = any> = Record<P, string | string[]>;

interface EventContext<Env, P extends string, Data> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Params<P>;
  data: Data;
}

type PagesFunction<Env = unknown, Params extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> = (
  context: EventContext<Env, Params, Data>
) => Response | Promise<Response>;

interface Env {
  DB: D1Database;
}

/**
 * 自动初始化数据库表结构 (Code-First Migration)
 * 解决无法通过 wrangler.toml 执行迁移的问题
 */
async function ensureTableInitialized(db: D1Database) {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        company TEXT,
        roles TEXT,
        location TEXT,
        link TEXT,
        raw_text TEXT,
        created_at TEXT
      )
    `);
  } catch (e) {
    console.error("Database initialization failed:", e);
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. 安全检查：如果未绑定数据库，返回 503 而不是崩溃
  if (!env.DB) {
    return new Response(
      JSON.stringify({ 
        error: "Database binding 'DB' is missing. Please check Cloudflare Dashboard settings." 
      }), 
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. 处理 GET 请求
  if (request.method === "GET") {
    try {
      const { results } = await env.DB.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      // 容错处理：如果表不存在，尝试创建表并重试
      if (e.message && (e.message.includes("no such table") || e.message.includes("prepare"))) {
        await ensureTableInitialized(env.DB);
        try {
           const { results } = await env.DB.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
           return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
        } catch (retryError: any) {
           return new Response(JSON.stringify({ error: retryError.message }), { status: 500 });
        }
      }
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // 3. 处理 POST 请求
  if (request.method === "POST") {
    try {
      const jobs = await request.json() as any[];
      if (!jobs || jobs.length === 0) {
        return new Response("No data provided", { status: 400 });
      }

      try {
        const stmt = env.DB.prepare(
          "INSERT INTO jobs (id, company, roles, location, link, raw_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        const batch = jobs.map(job => 
          stmt.bind(job.id, job.company, job.roles, job.location, job.link, job.raw_text, job.created_at)
        );
        await env.DB.batch(batch);
      } catch (e: any) {
        // 容错处理：如果表不存在，尝试创建表并重试
        if (e.message && (e.message.includes("no such table") || e.message.includes("prepare"))) {
           await ensureTableInitialized(env.DB);
           // 重新准备语句
           const stmt = env.DB.prepare(
             "INSERT INTO jobs (id, company, roles, location, link, raw_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
           );
           const batch = jobs.map(job => 
             stmt.bind(job.id, job.company, job.roles, job.location, job.link, job.raw_text, job.created_at)
           );
           await env.DB.batch(batch);
        } else {
           throw e;
        }
      }

      return new Response(JSON.stringify({ success: true, count: jobs.length }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // 4. 处理 DELETE 请求
  if (request.method === "DELETE") {
    try {
      await env.DB.prepare("DELETE FROM jobs").run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      // 如果表不存在，删除操作也可以视为成功（本身就是空的）
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
