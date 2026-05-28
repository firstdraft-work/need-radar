import { RawPost } from "./types";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const clientId = process.env.PH_CLIENT_ID;
  const clientSecret = process.env.PH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PH_CLIENT_ID or PH_CLIENT_SECRET");
  }

  const res = await fetch("https://api.producthunt.com/v2/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Product Hunt auth failed: ${res.status}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.token;
}

const POSTS_QUERY = `
query($cursor: String, $topic: String) {
  posts(first: 20, after: $cursor, order: VOTES, topic: $topic) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
        commentsCount
        createdAt
        topics(first: 5) {
          edges {
            node {
              name
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

interface PHPost {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
  topics: { edges: { node: { name: string } }[] };
}

/** Check if a post matches any of the keyword tokens (lenient matching) */
function matchesKeyword(post: PHPost, keyword: string): boolean {
  const tokens = keyword.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (tokens.length === 0) return true;

  const searchable = [post.name, post.tagline, post.description]
    .join(" ")
    .toLowerCase();
  const topics = post.topics.edges
    .map((e) => e.node.name)
    .join(" ")
    .toLowerCase();
  const fullText = `${searchable} ${topics}`;

  // Match if ANY token appears (lenient: "ai writing tool" → match if "ai" OR "writing" OR "tool")
  return tokens.some((token) => fullText.includes(token));
}

/** Map common keywords to PH topic slugs for better results */
function keywordToTopic(keyword: string): string | undefined {
  const kw = keyword.toLowerCase();
  const topicMap: Record<string, string> = {
    ai: "artificial-intelligence",
    "artificial intelligence": "artificial-intelligence",
    saas: "saas",
    developer: "developer-tools",
    dev: "developer-tools",
    productivity: "productivity",
    design: "design-tools",
    marketing: "marketing",
    finance: "fintech",
    health: "health-and-fitness",
    education: "education",
    writing: "writing",
    code: "developer-tools",
    coding: "developer-tools",
    nocode: "no-code",
    "no code": "no-code",
    startup: "startup",
  };

  const tokens = kw.split(/\s+/);
  for (const token of tokens) {
    if (topicMap[token]) return topicMap[token];
  }
  for (const [key, slug] of Object.entries(topicMap)) {
    if (kw.includes(key)) return slug;
  }
  return undefined;
}

export async function searchProductHunt(keyword: string): Promise<RawPost[]> {
  const token = await getAccessToken();
  const allPosts: PHPost[] = [];
  const seenIds = new Set<string>();

  // Strategy 1: Fetch by matching topic (if keyword maps to one)
  const topic = keywordToTopic(keyword);
  const fetchTasks: Promise<void>[] = [];

  const fetchPage = async (topicSlug?: string) => {
    let cursor: string | null = null;
    for (let page = 0; page < 3; page++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res: Response = await fetch(
        "https://api.producthunt.com/v2/api/graphql",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: POSTS_QUERY,
            variables: {
              cursor,
              ...(topicSlug ? { topic: topicSlug } : {}),
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!res.ok) break;

      const data: Record<string, unknown> = await res.json();
      const postsData = (
        data as {
          data?: {
            posts?: {
              edges?: { node: PHPost }[];
              pageInfo?: { hasNextPage?: boolean; endCursor?: string };
            };
          };
        }
      ).data?.posts;
      const edges = postsData?.edges ?? [];

      for (const edge of edges) {
        if (!seenIds.has(edge.node.id)) {
          seenIds.add(edge.node.id);
          allPosts.push(edge.node);
        }
      }

      const pageInfo = postsData?.pageInfo;
      if (!pageInfo?.hasNextPage) break;
      cursor = pageInfo.endCursor ?? null;
    }
  };

  // Fetch general top posts + topic-specific posts in parallel
  fetchTasks.push(fetchPage()); // General top posts
  if (topic) {
    fetchTasks.push(fetchPage(topic)); // Topic-specific
  }

  await Promise.all(fetchTasks);

  // Filter by keyword (lenient matching)
  const matched = allPosts
    .filter((post) => matchesKeyword(post, keyword))
    .map((post) => ({
      source: "producthunt" as const,
      title: post.name,
      body: post.description ?? "",
      url: post.url,
      upvotes: post.votesCount,
      comments: post.commentsCount,
      tagline: post.tagline,
      createdAt: post.createdAt,
    }));

  // If keyword matching returns too few, return top posts anyway (for AI to evaluate)
  if (matched.length < 3) {
    const topGeneral = allPosts.slice(0, 15).map((post) => ({
      source: "producthunt" as const,
      title: post.name,
      body: post.description ?? "",
      url: post.url,
      upvotes: post.votesCount,
      comments: post.commentsCount,
      tagline: post.tagline,
      createdAt: post.createdAt,
    }));
    // Merge and deduplicate
    const seen = new Set(matched.map((p) => p.url));
    for (const p of topGeneral) {
      if (!seen.has(p.url)) {
        matched.push(p);
        seen.add(p.url);
      }
    }
  }

  return matched;
}
