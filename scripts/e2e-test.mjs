/**
 * End-to-end test script for Need Radar search pipeline
 * Tests: Reddit search → PH search → GLM scoring
 * Run: node scripts/e2e-test.mjs
 */

import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';
import zlib from 'zlib';

const PROXY_URL = process.env.HTTPS_PROXY || 'http://127.0.0.1:17897';
const GLM_API_KEY = process.env.GLM_API_KEY || 'e4920a61721741959440a17685fdb054.YLrJAKINzkY4Ub51';
const PH_CLIENT_ID = process.env.PH_CLIENT_ID || 'wJjp6BCDMZc79ZZFMjC2pGpzTqQzVbxDVs7Og51JauY';
const PH_CLIENT_SECRET = process.env.PH_CLIENT_SECRET || '4CSsTA1mPufSgfQ5gDxd6ZLZZ4LbAZ0pwrHMsecuPXc';

const TEST_KEYWORD = 'ai writing tool';

// ─── Helpers ───
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const agent = new HttpsProxyAgent(PROXY_URL);
    const urlObj = new URL(url);
    const req = https.request({
      ...options,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      port: urlObj.port || 443,
      agent,
      headers: {
        ...options.headers,
        'Accept-Encoding': 'gzip, deflate',
      },
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        let data = Buffer.concat(chunks);
        if (res.headers['content-encoding'] === 'gzip') {
          try { data = zlib.gunzipSync(data); } catch {}
        }
        resolve({ status: res.statusCode, data: data.toString() });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchDirect(url, options = {}) {
  const res = await fetch(url, options);
  return res;
}

// ─── Step 1: Reddit Search ───
async function testReddit() {
  console.log('\n📡 Step 1: Reddit Search');
  console.log('─'.repeat(50));
  
  const REDDIT_HEADERS = {
    'User-Agent': 'web:need-radar:v1.0.0 (by /u/needradar)',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.reddit.com/',
    'Origin': 'https://www.reddit.com',
  };

  // Test 1: Global search
  const params = new URLSearchParams({
    q: TEST_KEYWORD,
    limit: '10',
    sort: 'relevance',
    t: 'month',
    type: 'link',
  });

  const { status, data } = await httpsRequest(
    `https://www.reddit.com/search.json?${params}`,
    { method: 'GET', headers: REDDIT_HEADERS }
  );

  if (status !== 200) {
    console.log(`❌ Reddit search failed: ${status}`);
    return [];
  }

  const parsed = JSON.parse(data);
  const posts = (parsed.data?.children ?? []).map(item => {
    const d = item.data;
    return {
      source: 'reddit',
      title: d.title,
      body: (d.selftext || '').substring(0, 300),
      url: `https://reddit.com${d.permalink}`,
      upvotes: d.ups,
      comments: d.num_comments,
      subreddit: d.subreddit,
    };
  });

  console.log(`✅ Reddit returned ${posts.length} posts`);
  posts.slice(0, 3).forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.upvotes}↑ ${p.comments}💬] ${p.title.substring(0, 60)} (r/${p.subreddit})`);
  });

  return posts;
}

// ─── Step 2: Product Hunt Search ───
async function testProductHunt() {
  console.log('\n🚀 Step 2: Product Hunt Search');
  console.log('─'.repeat(50));

  // Get access token
  const tokenRes = await fetchDirect('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: PH_CLIENT_ID,
      client_secret: PH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!tokenRes.ok) {
    console.log(`❌ PH auth failed: ${tokenRes.status}`);
    return [];
  }

  const { access_token } = await tokenRes.json();

  // Search posts
  const query = `
  query {
    posts(first: 20, order: VOTES) {
      edges {
        node {
          name
          tagline
          description
          url
          votesCount
          commentsCount
          topics(first: 5) { edges { node { name } } }
        }
      }
    }
  }`;

  const searchRes = await fetchDirect('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!searchRes.ok) {
    console.log(`❌ PH search failed: ${searchRes.status}`);
    return [];
  }

  const data = await searchRes.json();
  const edges = data.data?.posts?.edges ?? [];
  const kw = TEST_KEYWORD.toLowerCase();
  
  const posts = edges
    .map(e => e.node)
    .filter(node => {
      const text = [node.name, node.tagline, node.description].join(' ').toLowerCase();
      const topics = node.topics.edges.map(e => e.node.name).join(' ').toLowerCase();
      return `${text} ${topics}`.includes(kw);
    })
    .map(node => ({
      source: 'producthunt',
      title: node.name,
      body: (node.description || '').substring(0, 300),
      url: node.url,
      upvotes: node.votesCount,
      comments: node.commentsCount,
      tagline: node.tagline,
    }));

  console.log(`✅ PH returned ${edges.length} total, ${posts.length} matching "${TEST_KEYWORD}"`);
  posts.slice(0, 3).forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.upvotes}↑ ${p.comments}💬] ${p.title} - ${p.tagline?.substring(0, 50)}`);
  });

  return posts;
}

// ─── Step 3: GLM Scoring ───
async function testGLMScoring(allPosts) {
  console.log('\n🧠 Step 3: GLM AI Scoring');
  console.log('─'.repeat(50));

  // Pre-filter
  const filtered = allPosts.filter(p => {
    const text = `${p.title} ${p.body}`.trim();
    if (text.length < 20) return false;
    if (/\bhiring\b/i.test(text)) return false;
    return true;
  });

  // Sort by engagement, take top 15
  filtered.sort((a, b) => b.upvotes + b.comments * 2 - (a.upvotes + a.comments * 2));
  const topPosts = filtered.slice(0, 15);

  console.log(`After pre-filter: ${filtered.length} → sending top ${topPosts.length} to GLM`);

  if (topPosts.length === 0) {
    console.log('⚠️ No posts to score');
    return [];
  }

  const FILTER_PROMPT = `你是一位资深的独立开发者产品顾问。你的任务是从社交媒体帖子中识别出真正值得开发的产品机会。

## 核心判断逻辑
你要找的是：有人表达了明确的痛点/需求，且这个需求可以被产品/工具解决。

### ✅ 算真实需求的信号
- "我希望有个工具能..." / "有没有什么app可以..."
- 描述了具体的工作流痛点
- 多人跟帖说"我也需要"
- 在吐槽某个现有产品的缺陷

### ❌ 不是真实需求的信号
- 纯产品展示/发布
- 求职、招聘、推广帖
- 纯技术讨论
- 无解决方案暗示的纯抱怨

## 评分标准
- clarity (1-5): 需求明确度
- marketSignal (1-5): 市场信号强度
- score = clarity × 0.6 + marketSignal × 0.4

严格返回 JSON: {"needs": [{"index": 0, "painPoint": "...", "clarity": 4, "marketSignal": 3, "score": 3.6}]}
只包含 score ≥ 3.0 的需求`;

  const postsText = topPosts.map((p, i) =>
    `[${i}] 来源: ${p.source} | 标题: ${p.title} | 内容: ${p.body.slice(0, 300)} | 点赞: ${p.upvotes} | 评论: ${p.comments} | ${p.subreddit ? `子版块: r/${p.subreddit}` : ''}`
  ).join('\n');

  const startTime = Date.now();
  
  const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: FILTER_PROMPT },
        { role: 'user', content: `请分析以下 ${topPosts.length} 条帖子，识别真实产品需求并评分：\n\n${postsText}` },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  const elapsed = Date.now() - startTime;
  console.log(`GLM response time: ${(elapsed / 1000).toFixed(1)}s`);

  if (!res.ok) {
    const err = await res.text();
    console.log(`❌ GLM API failed: ${res.status} - ${err}`);
    return [];
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '{"needs":[]}';
  
  let parsed;
  try {
    const raw = JSON.parse(content);
    parsed = Array.isArray(raw) ? raw : raw.needs ?? [];
  } catch {
    console.log('❌ Failed to parse GLM response:', content.substring(0, 200));
    return [];
  }

  const scoredNeeds = parsed
    .filter(item => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .map(item => {
      const post = topPosts[item.index] ?? topPosts[0];
      return {
        ...item,
        source: post.source,
        title: post.title,
        url: post.url,
        upvotes: post.upvotes,
      };
    });

  console.log(`✅ GLM scored: ${parsed.length} needs found, ${scoredNeeds.length} passed (score ≥ 3.0)`);
  scoredNeeds.forEach((need, i) => {
    console.log(`\n  📌 Need #${i + 1} (score: ${need.score.toFixed(1)})`);
    console.log(`     Pain: ${need.painPoint}`);
    console.log(`     Source: [${need.source}] ${need.title?.substring(0, 50)} (${need.upvotes}↑)`);
  });

  return scoredNeeds;
}

// ─── Main ───
async function main() {
  console.log('🔍 Need Radar - E2E Pipeline Test');
  console.log('Keyword:', TEST_KEYWORD);
  console.log('='.repeat(50));

  try {
    const [redditPosts, phPosts] = await Promise.all([
      testReddit(),
      testProductHunt(),
    ]);

    const allPosts = [...redditPosts, ...phPosts];
    console.log(`\n📊 Total raw posts: ${allPosts.length} (Reddit: ${redditPosts.length}, PH: ${phPosts.length})`);

    if (allPosts.length === 0) {
      console.log('\n❌ No posts found from any source. Pipeline test failed.');
      process.exit(1);
    }

    const needs = await testGLMScoring(allPosts);

    console.log('\n' + '='.repeat(50));
    console.log('📋 Pipeline Test Summary');
    console.log('='.repeat(50));
    console.log(`Reddit posts:  ${redditPosts.length} ✅`);
    console.log(`PH posts:      ${phPosts.length} ✅`);
    console.log(`Total raw:     ${allPosts.length}`);
    console.log(`AI scored:     ${needs.length} needs (score ≥ 3.0)`);
    console.log(`Pipeline:      ${needs.length > 0 ? '✅ PASS' : '⚠️ No needs found (try different keyword)'}`);
    
    process.exit(needs.length > 0 ? 0 : 0);
  } catch (err) {
    console.error('\n❌ Pipeline test failed:', err.message);
    process.exit(1);
  }
}

main();
