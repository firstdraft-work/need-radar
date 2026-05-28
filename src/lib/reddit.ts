import { RawPost } from "./types";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "https";
import zlib from "zlib";

/**
 * Search Reddit for posts matching a keyword.
 *
 * Network notes:
 * - Reddit is blocked in mainland China. Set HTTPS_PROXY in .env.local for proxy access.
 * - Reddit's JSON API requires Referer + Origin headers to return 200 (otherwise 403).
 * - Uses https-proxy-agent for reliable proxy support.
 */

const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const REDDIT_HEADERS = {
  "User-Agent": "web:need-radar:v1.0.0 (by /u/needradar)",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.reddit.com/",
  Origin: "https://www.reddit.com",
};

/** Make an HTTPS request through proxy if configured, with gzip handling */
function httpsRequest(
  url: string,
  options: https.RequestOptions
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions: https.RequestOptions = {
      ...options,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      port: urlObj.port || 443,
      agent: proxyAgent,
      headers: {
        ...options.headers,
        "Accept-Encoding": "gzip, deflate",
      },
    };

    const req = https.request(reqOptions, (res) => {
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
    });

    req.on("error", reject);
    req.end();
  });
}

/** Map keyword tokens to relevant subreddits */
function getRelevantSubreddits(keyword: string): string[] {
  const kw = keyword.toLowerCase();
  const tokens = kw.split(/\s+/);

  // Always include these core indie dev subreddits
  const core = ["indiehackers", "SideProject", "Entrepreneur", "startups"];

  // Keyword-specific subreddits
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
  };

  const specific: string[] = [];
  for (const [key, subs] of Object.entries(keywordMap)) {
    if (tokens.some((t) => t === key) || kw.includes(key)) {
      specific.push(...subs);
    }
  }

  // Combine: specific subs first, then core (deduplicated)
  const all = [...new Set([...specific, ...core])];
  return all.slice(0, 10); // Max 10 subreddits to avoid rate limiting
}

/** Fetch hot posts from a single subreddit */
async function fetchSubredditHot(
  subreddit: string
): Promise<RawPost[]> {
  try {
    const { status, data } = await httpsRequest(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=15`,
      { method: "GET", headers: REDDIT_HEADERS }
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
  const searchQueries = [keyword]; // Full keyword first

  // If multi-word, also search with just the most important token
  if (tokens.length > 1) {
    // Add the most unique-looking token (longest, not a common stop word)
    const stopWords = new Set(["the", "a", "an", "is", "are", "was", "for", "and", "or", "of", "in", "to", "tool", "app", "best", "good", "need"]);
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
      const { status, data } = await httpsRequest(
        `https://www.reddit.com/search.json?${params}`,
        { method: "GET", headers: REDDIT_HEADERS }
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
      // Lenient matching: if ANY keyword token appears in title/body
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

  // Sort by engagement for better quality
  unique.sort(
    (a, b) => b.upvotes + b.comments * 2 - (a.upvotes + a.comments * 2)
  );

  if (unique.length === 0 && errors.length > 0) {
    throw new Error(`Reddit 搜索失败: ${errors.join("; ")}`);
  }

  return unique.slice(0, limit);
}
