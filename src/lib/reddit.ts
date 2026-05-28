import { RawPost } from "./types";

/**
 * Search Reddit for posts matching a keyword.
 *
 * Network strategy:
 * - ALL environments use Node.js `https` module (not fetch!)
 *   because fetch() silently drops Referer/Origin headers (forbidden headers per spec)
 * - Local dev: https-proxy-agent for China proxy
 * - Vercel: direct https request (US servers, no proxy needed)
 * - Reddit's JSON API requires Referer + Origin headers (otherwise 403)
 */

const IS_VERCEL = !!process.env.VERCEL;

const REDDIT_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate",
  Referer: "https://www.reddit.com/",
  Origin: "https://www.reddit.com",
};

// Lazy-loaded modules
let _proxyAgent: InstanceType<typeof import("https-proxy-agent").HttpsProxyAgent> | undefined;
let _https: typeof import("https") | undefined;
let _zlib: typeof import("zlib") | undefined;

async function getModules() {
  if (_https && _zlib) {
    return { agent: _proxyAgent, https: _https, zlib: _zlib };
  }

  const https = await import("https");
  const zlib = await import("zlib");
  _https = https;
  _zlib = zlib;

  // Only load proxy agent if not on Vercel and proxy URL exists
  if (!IS_VERCEL && !_proxyAgent) {
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;

    if (proxyUrl) {
      const { HttpsProxyAgent } = await import("https-proxy-agent");
      _proxyAgent = new HttpsProxyAgent(proxyUrl);
    }
  }

  return { agent: IS_VERCEL ? undefined : _proxyAgent, https, zlib };
}

/** Make a Reddit JSON API request using Node.js https (full header control) */
async function redditFetch(url: string): Promise<{ status: number; data: string }> {
  const { agent, https, zlib } = await getModules();

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        port: urlObj.port || 443,
        method: "GET",
        agent: agent ?? undefined,
        headers: REDDIT_HEADERS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          let data = Buffer.concat(chunks);
          if (res.headers["content-encoding"] === "gzip") {
            try {
              data = zlib.gunzipSync(data);
            } catch {
              // If gunzip fails, use raw data
            }
          }
          resolve({ status: res.statusCode ?? 0, data: data.toString() });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Reddit request timeout"));
    });
    req.end();
  });
}

/** Map keyword tokens to relevant subreddits */
function getRelevantSubreddits(keyword: string): string[] {
  const kw = keyword.toLowerCase();
  const tokens = kw.split(/\s+/);

  const core = ["indiehackers", "SideProject", "Entrepreneur", "startups"];

  const keywordMap: Record<string, string[]> = {
    ai: ["artificial", "MachineLearning", "ChatGPT", "LocalLLaMA"],
    "artificial intelligence": ["artificial", "MachineLearning", "ChatGPT"],
    saas: ["SaaS", "micro_saas"],
    "micro saas": ["micro_saas", "SaaS"],
    coding: ["programming", "webdev", "learnprogramming"],
    developer: ["programming", "webdev", "devops"],
    design: ["web_design", "UI_Design", "userexperience"],
    writing: ["writing", "freelanceWriters", "selfpublish"],
    productivity: ["productivity", "getdisciplined"],
    finance: ["finanzen", "personalfinance"],
    health: ["health", "Fitness"],
    marketing: ["marketing", "digital_marketing"],
    nocode: ["nocode", "lowcode"],
    "no code": ["nocode", "lowcode"],
    crypto: ["cryptocurrency", "bitcoin"],
    game: ["gamedev", "IndieGaming"],
    app: ["apps", "androiddev", "iOSProgramming"],
    tool: ["tools", "selfhosted"],
    email: ["email", "selfhosted"],
    invoice: ["smallbusiness", "Entrepreneur"],
    landing: ["webdev", "SideProject"],
    cron: ["selfhosted", "programming", "devops"],
    note: ["productivity", "webdev"],
    monitor: ["selfhosted", "devops", "programming"],
  };

  const specific: string[] = [];
  for (const [key, subs] of Object.entries(keywordMap)) {
    if (tokens.some((t) => t === key) || kw.includes(key)) {
      specific.push(...subs);
    }
  }

  const all = [...new Set([...specific, ...core])];
  return all.slice(0, 10);
}

/** Fetch hot posts from a single subreddit */
async function fetchSubredditHot(subreddit: string): Promise<RawPost[]> {
  try {
    const { status, data } = await redditFetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=15`
    );
    if (status !== 200) return [];

    const parsed = JSON.parse(data);
    const posts = parsed.data?.children ?? [];
    return posts.map((item: { data: Record<string, unknown> }) => {
      const d = item.data;
      return {
        source: "reddit" as const,
        title: String(d.title ?? ""),
        body: String(d.selftext ?? ""),
        url: `https://reddit.com${d.permalink}`,
        upvotes: Number(d.ups ?? 0),
        comments: Number(d.num_comments ?? 0),
        subreddit: String(d.subreddit ?? ""),
        createdAt: new Date(Number(d.created_utc) * 1000).toISOString(),
      };
    });
  } catch {
    return [];
  }
}

/** Search Reddit for posts matching a keyword */
export async function searchReddit(
  keyword: string,
  limit = 30
): Promise<RawPost[]> {
  const allPosts: RawPost[] = [];
  const errors: string[] = [];

  // Strategy 1: Global search with original keyword + individual tokens
  const tokens = keyword.split(/\s+/).filter((t) => t.length > 1);
  const searchQueries = [keyword];

  if (tokens.length > 1) {
    const stopWords = new Set([
      "the", "a", "an", "is", "are", "was", "for", "and", "or", "of", "in",
      "to", "tool", "app", "best", "good", "need",
    ]);
    const meaningful = tokens.filter((t) => !stopWords.has(t.toLowerCase()));
    if (meaningful.length > 0) {
      searchQueries.push(meaningful.join(" "));
    }
  }

  for (const query of searchQueries) {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: "25",
        sort: "relevance",
        t: "month",
        type: "link",
      });
      const { status, data } = await redditFetch(
        `https://www.reddit.com/search.json?${params}`
      );

      if (status === 200) {
        const parsed = JSON.parse(data);
        const posts = parsed.data?.children ?? [];
        for (const item of posts) {
          const d = item.data;
          allPosts.push({
            source: "reddit" as const,
            title: String(d.title ?? ""),
            body: String(d.selftext ?? ""),
            url: `https://reddit.com${d.permalink}`,
            upvotes: Number(d.ups ?? 0),
            comments: Number(d.num_comments ?? 0),
            subreddit: String(d.subreddit ?? ""),
            createdAt: new Date(Number(d.created_utc) * 1000).toISOString(),
          });
        }
      } else {
        errors.push(`Reddit search "${query}": ${status}`);
      }
    } catch (err) {
      errors.push(
        `Reddit search "${query}": ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  // Strategy 2: Fetch hot posts from relevant subreddits (parallel, with keyword filtering)
  const subreddits = getRelevantSubreddits(keyword);
  const subredditResults = await Promise.allSettled(
    subreddits.map((sub) => fetchSubredditHot(sub))
  );

  const kwTokens = keyword
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  for (const result of subredditResults) {
    if (result.status === "fulfilled") {
      const filtered = result.value.filter((post) => {
        const text = `${post.title} ${post.body}`.toLowerCase();
        return kwTokens.some((token) => text.includes(token));
      });
      allPosts.push(...filtered);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allPosts.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  // Sort by engagement
  unique.sort(
    (a, b) => b.upvotes + b.comments * 2 - (a.upvotes + a.comments * 2)
  );

  if (unique.length === 0 && errors.length > 0) {
    throw new Error(`Reddit 搜索失败: ${errors.join("; ")}`);
  }

  return unique.slice(0, limit);
}
