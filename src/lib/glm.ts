import { RawPost, ScoredNeed } from "./types";

const FILTER_PROMPT = `你是一位资深的独立开发者产品顾问。你的任务是从社交媒体帖子中识别出**真正值得开发的产品机会**。

## 核心判断逻辑

你要找的是：有人表达了明确的痛点/需求，且这个需求可以被产品/工具解决。

### ✅ 算真实需求的信号
- "我希望有个工具能..." / "有没有什么app可以..." / "Is there a tool that..."
- 描述了具体的工作流痛点（效率低、手动重复、缺少某功能）
- 多人跟帖说"我也需要" / "me too" / "take my money"
- 在吐槽某个现有产品的缺陷，暗示需要替代方案

### ❌ 不是真实需求的信号
- 纯产品展示/发布（"我做了个XX" / "Introducing XX"）
- 求职、招聘、推广帖
- 纯技术讨论（"如何实现XX"）
- 通用求助（"怎么学XX"）
- 无解决方案暗示的纯抱怨

## 评分标准

### 需求明确度 (clarity, 1-5)
- 1：完全没有需求，或需求极其模糊
- 2：隐约有需求方向，但不具体
- 3：有明确痛点，但解决方案方向不清晰
- 4：痛点清晰，场景具体，可以想象产品形态
- 5：痛点非常具体，几乎可以直接开始设计产品

### 市场信号 (marketSignal, 1-5)
- 1：孤立帖子，无互动共鸣
- 2：少量互动（<5 评论），无"我也需要"类回复
- 3：中等互动（5-20 评论），有人表达类似需求
- 4：较高互动（20-50 评论），多人明确说需要
- 5：高互动（50+ 评论或高点赞），强共鸣，多人表示愿意付费

## 输出格式

严格返回以下 JSON 结构，不要包含任何其他文字：
{
  "needs": [
    {
      "index": 0,
      "painPoint": "一句话精炼描述用户的核心痛点，格式：'用户需要...来解决...问题'",
      "clarity": 4,
      "marketSignal": 3,
      "score": 3.6
    }
  ]
}

规则：
- score = clarity × 0.6 + marketSignal × 0.4
- 只包含 score ≥ 3.0 的需求
- 没有合格需求时返回 {"needs": []}`;

/** Pre-filter: remove obviously low-quality posts before sending to LLM */
function preFilterPosts(posts: RawPost[]): RawPost[] {
  return posts.filter((post) => {
    // Skip empty posts
    if (!post.title.trim() && !post.body.trim()) return false;

    // Skip very short posts (likely not substantive)
    const text = `${post.title} ${post.body}`.trim();
    if (text.length < 20) return false;

    // Skip obvious non-need patterns
    const lower = text.toLowerCase();
    const skipPatterns = [
      /\bhiring\b/i,
      /\blooking for (a |an )?(job|work|position|role|intern)/i,
      /\bjob (posting|listing|opening)/i,
      /^[A-Z\s]{10,}$/, // all caps title
    ];
    for (const pattern of skipPatterns) {
      if (pattern.test(lower)) return false;
    }

    return true;
  });
}

/** Split posts into batches to avoid LLM context overload */
function batchPosts(posts: RawPost[], batchSize: number): RawPost[][] {
  const batches: RawPost[][] = [];
  for (let i = 0; i < posts.length; i += batchSize) {
    batches.push(posts.slice(i, i + batchSize));
  }
  return batches;
}

function formatPosts(posts: RawPost[]): string {
  return posts
    .map(
      (p, i) =>
        `[${i}] 来源: ${p.source} | 标题: ${p.title} | ${p.tagline ? `副标题: ${p.tagline} | ` : ""}内容: ${p.body.slice(0, 300)} | 点赞: ${p.upvotes} | 评论: ${p.comments} | ${p.subreddit ? `子版块: r/${p.subreddit}` : ""}`
    )
    .join("\n");
}

export async function filterAndScore(posts: RawPost[]): Promise<ScoredNeed[]> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GLM_API_KEY");
  }

  if (posts.length === 0) return [];

  // Step 1: Pre-filter low-quality posts
  const filtered = preFilterPosts(posts);
  if (filtered.length === 0) return [];

  // Step 2: Sort by engagement (upvotes + comments) — higher engagement first
  filtered.sort((a, b) => b.upvotes + b.comments * 2 - (a.upvotes + a.comments * 2));

  // Step 3: Take top 15 most engaged posts (avoid sending too many to LLM)
  const topPosts = filtered.slice(0, 15);

  // Step 4: Batch processing (max 15 per batch, so usually just 1 batch)
  const batches = batchPosts(topPosts, 15);
  const allResults: { index: number; painPoint: string; clarity: number; marketSignal: number; score: number }[] = [];

  try {
    for (const batch of batches) {
      const postsText = formatPosts(batch);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "glm-4-flash",
          messages: [
            { role: "system", content: FILTER_PROMPT },
            { role: "user", content: `请分析以下 ${batch.length} 条帖子，识别真实产品需求并评分：\n\n${postsText}` },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.text();
        console.error(`GLM API failed: ${res.status} - ${err}`);
        continue; // Skip this batch, continue with others
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? '{"needs":[]}';

      let parsed: { index: number; painPoint: string; clarity: number; marketSignal: number; score: number }[];
      try {
        const raw = JSON.parse(content);
        const needs = Array.isArray(raw) ? raw : raw.needs ?? raw.results ?? [];
        // Adjust indices for batch offset
        const batchOffset = topPosts.indexOf(batch[0]);
        parsed = needs.map((item: { index: number; painPoint: string; clarity: number; marketSignal: number; score: number }) => ({
          ...item,
          index: item.index + (batchOffset > 0 ? batchOffset : 0),
        }));
      } catch {
        console.error("Failed to parse GLM response:", content);
        continue;
      }

      allResults.push(...parsed);
    }
  } catch (err) {
    console.error("GLM processing error:", err);
    return [];
  }

  return allResults
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .map((item) => {
      const post = topPosts[item.index] ?? topPosts[0];
      return {
        source: post.source,
        title: post.title,
        painPoint: item.painPoint,
        clarity: item.clarity,
        marketSignal: item.marketSignal,
        score: item.score,
        originalUrl: post.url,
        upvotes: post.upvotes,
        comments: post.comments,
        subreddit: post.subreddit,
        tagline: post.tagline,
      };
    });
}
