import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables.
// Prefer a local .env.local file for developer secrets while still falling back to .env.
dotenv.config({ path: [".env.local", ".env"] });

// Initialize Express
const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 3000);

function buildFallbackSummary(
  title: string,
  description?: string,
  content?: string,
  reason: "missing-key" | "temporary-unavailable" = "missing-key"
) {
  const safeTitle = title?.replace(/\s+/g, " ").trim() || "This article";
  const summaryLead = (description || content || "").replace(/\s+/g, " ").trim();
  const trimmedTitle = safeTitle.length > 80 ? `${safeTitle.slice(0, 77).trim()}...` : safeTitle;

  const thirdBullet =
    reason === "missing-key"
      ? "Add GROQ_API_KEY to enable live AI-generated insights from the full article text."
      : "Groq is temporarily busy, so this preview summary is being generated locally until service demand drops.";

  return [
    `The story centers on ${trimmedTitle}.`,
    summaryLead
      ? `${summaryLead.slice(0, 150)}${summaryLead.length > 150 ? "..." : ""}`
      : "The coverage highlights a major development with broader market, policy, or public impact.",
    thirdBullet,
  ];
}

// Middleware for parsing JSON requests
app.use(express.json());

function parseGroqSummaryContent(raw: string): string[] {
  let clean = raw.trim();

  if (clean.startsWith("```")) {
    const fenceMatch = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    clean = fenceMatch ? fenceMatch[1].trim() : clean.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }

  const parsed = JSON.parse(clean);

  if (Array.isArray(parsed)) {
    return parsed.filter((item) => typeof item === "string");
  }

  if (Array.isArray(parsed?.bullets)) {
    return parsed.bullets.filter((item: unknown) => typeof item === "string");
  }

  if (Array.isArray(parsed?.summary)) {
    return parsed.summary.filter((item: unknown) => typeof item === "string");
  }

  if (typeof parsed === "string") {
    return [parsed];
  }

  throw new Error("Groq summary response did not include a valid array of bullet points.");
}

async function generateGroqSummary(articlePrompt: string): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      temperature: 0.2,
      max_tokens: 256,
      messages: [
        {
          role: "system",
          content:
            "You are an expert news editor. Return exactly 3 concise bullets in JSON format. Use a top-level array of strings, for example [\"bullet one\", \"bullet two\", \"bullet three\"].",
        },
        { role: "user", content: articlePrompt },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Groq API request failed (${response.status}): ${details}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq API response did not include a message content.");
  }

  const bullets = parseGroqSummaryContent(content);
  return bullets.slice(0, 3).length === 3 ? bullets.slice(0, 3) : bullets;
}

// High quality editorial photo collections per news topic (20+ photos per topic)
const PHOTO_POOLS: Record<string, string[]> = {
  business: [
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542744801-30d00f050a68?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
  ],
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
  ],
  sports: [
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80",
  ],
  science: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?auto=format&fit=crop&w=800&q=80",
  ],
  health: [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=800&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1473186578172-c141e3448de2?auto=format&fit=crop&w=800&q=80",
  ],
};

// Title Keyword to Specific High-Res Image Mapping
const KEYWORD_IMAGE_MAP: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ["ai", "artificial intelligence", "nvidia", "chatgpt", "gemini", "llm", "openai", "robot", "robotics", "claude"],
    url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["apple", "iphone", "macbook", "ipad", "ios"],
    url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["google", "android", "pixel", "alphabet", "chrome"],
    url: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["space", "nasa", "mars", "moon", "rocket", "spacex", "satellite", "astronomy", "orbit", "telescope"],
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["stock", "stocks", "wall street", "fed", "inflation", "market", "nasdaq", "dow", "investor", "shares", "rally"],
    url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["crypto", "bitcoin", "ethereum", "blockchain", "solana", "coinbase"],
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["football", "soccer", "champions league", "premier league", "messi", "ronaldo", "fifa", "la liga"],
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["cricket", "ipl", "test match", "wicket", "bcci"],
    url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["basketball", "nba", "lakers", "celtics", "hoops"],
    url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["tennis", "wimbledon", "atp", "us open"],
    url: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["f1", "formula 1", "racing", "grand prix", "ferrari", "verstappen"],
    url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["doctor", "hospital", "cancer", "fda", "vaccine", "medicine", "health", "pharma", "clinical", "surgery"],
    url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["climate", "weather", "storm", "hurricane", "earthquake", "environment", "solar", "global warming", "flood"],
    url: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["election", "president", "biden", "trump", "congress", "senate", "vote", "white house", "parliament", "minister", "governor", "officials", "government", "agency", "department", "update"],
    url: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["court", "judge", "lawsuit", "legal", "supreme court", "attorney", "trial", "verdict", "police", "arrest", "crime", "investigation", "rape", "suspect", "victim", "probe"],
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["war", "military", "defense", "army", "navy", "air force", "missile", "strike", "conflict", "pentagon"],
    url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["movie", "cinema", "film", "hollywood", "netflix", "oscar", "box office", "actor", "actress", "series"],
    url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["music", "concert", "grammy", "singer", "album", "band", "tour", "billboard", "song"],
    url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["car", "electric vehicle", "ev", "tesla", "automotive", "byd", "ford", "gm"],
    url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["flight", "airline", "airport", "boeing", "airbus", "plane", "aviation"],
    url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["gaming", "esports", "playstation", "xbox", "nintendo", "steam", "gamer"],
    url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["housing", "real estate", "mortgage", "property", "home", "building", "rent"],
    url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
  },
];

function getTopicImageUrl(category: string, title: string = "", sourceName: string = ""): string {
  const text = `${title || ""} ${sourceName || ""} ${category || "general"}`.toLowerCase();
  const matchedImages = [...KEYWORD_IMAGE_MAP];

  let bestMatch: { url: string; score: number } | null = null;

  for (const match of matchedImages) {
    let score = 0;
    for (const keyword of match.keywords) {
      const normalized = keyword.toLowerCase();
      if (!text.includes(normalized)) continue;

      score += normalized.includes(" ") ? 3 : 2;
      if ((title || "").toLowerCase().includes(normalized)) score += 2;
      if ((sourceName || "").toLowerCase().includes(normalized)) score += 1;
      if ((category || "general").toLowerCase() === normalized) score += 4;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { url: match.url, score };
    }
  }

  if (bestMatch) {
    return bestMatch.url;
  }

  const catKey = (category || "general").toLowerCase();
  const photos = PHOTO_POOLS[catKey] || PHOTO_POOLS.general;

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash + title.length + catKey.length + sourceName.length) % photos.length;
  return photos[index];
}

function extractImageFromHtml(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
    /<meta[^>]+property=["']og:image:url["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/&amp;/g, "&");
    }
  }

  return null;
}

function isGoogleNewsUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "news.google.com" || hostname.endsWith(".google.com") || hostname.includes("googleusercontent.com");
  } catch {
    return false;
  }
}

function isGenericImageUrl(url: string): boolean {
  if (!url) return true;

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const normalized = url.toLowerCase();

    return (
      hostname.includes("googleusercontent.com") ||
      hostname.includes("google.com") ||
      hostname.includes("gstatic.com") ||
      normalized.includes("s0-w300") ||
      normalized.includes("default-image") ||
      normalized.includes("placeholder") ||
      normalized.includes("rss")
    );
  } catch {
    return false;
  }
}

function sanitizeImageUrl(imageUrl: string, fallbackImage: string): string {
  if (!imageUrl) return fallbackImage;
  if (isGenericImageUrl(imageUrl)) return fallbackImage;
  return imageUrl;
}

async function resolveArticleImage(url: string, fallbackImage: string): Promise<string> {
  if (!url || isGoogleNewsUrl(url)) return fallbackImage;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return fallbackImage;

    const html = await response.text();
    const imageFromHtml = extractImageFromHtml(html);
    return sanitizeImageUrl(imageFromHtml || fallbackImage, fallbackImage);
  } catch (error) {
    return fallbackImage;
  }
}

// Helper to parse Google News RSS XML feed into structured articles
function parseGoogleNewsRss(xmlText: string, category: string = "general") {
  const items: any[] = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const sourceUrlMatch = itemXml.match(/<source[^>]*url="([^"]*)"/i);

    // Extract image if present in XML media tags or enclosure or description img
    const mediaMatch = itemXml.match(/<(?:media:content|media:thumbnail|enclosure)[^>]+url=["']([^"']+)["']/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    const imgInDescMatch = descMatch ? descMatch[1].match(/<img[^>]+src=["']([^"']+)["']/i) : null;

    let imageUrl = mediaMatch ? mediaMatch[1] : (imgInDescMatch ? imgInDescMatch[1] : "");

    let rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim() : "";
    rawTitle = rawTitle
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    let sourceName = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim() : "";
    if (!sourceName && rawTitle.includes(" - ")) {
      const parts = rawTitle.split(" - ");
      sourceName = parts.pop()?.trim() || "Google News";
      rawTitle = parts.join(" - ").trim();
    }

    const link = linkMatch ? linkMatch[1].trim() : "";
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();

    if (!imageUrl) {
      imageUrl = getTopicImageUrl(category, rawTitle, sourceName);
    } else {
      imageUrl = sanitizeImageUrl(imageUrl, getTopicImageUrl(category, rawTitle, sourceName));
    }

    if (rawTitle && link) {
      items.push({
        title: rawTitle,
        description: `Read live coverage from ${sourceName || "news publisher"}.`,
        content: "",
        url: link,
        image: imageUrl,
        publishedAt: pubDate,
        source: {
          name: sourceName || "Google News",
          url: sourceUrlMatch ? sourceUrlMatch[1] : "",
        },
      });
    }
  }

  return items;
}

// API Route: Live News Fetching
app.get("/api/news", async (req, res) => {
  const category = (req.query.category as string) || "general";
  const country = (req.query.country as string) || "us";
  const query = (req.query.query as string) || "";

  // Check which API keys are available
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
  const NEWS_API_KEY = process.env.NEWS_API_KEY;

  try {
    let articles: any[] = [];
    let provider = "google_rss";

    if (query) {
      // If there is a search query, use custom search if keys are available
      if (GNEWS_API_KEY) {
        provider = "gnews";
        const searchUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=${country}&apikey=${GNEWS_API_KEY}`;
        console.log(`[API] Fetching search query "${query}" from GNews API`);
        const response = await fetch(searchUrl);
        if (response.ok) {
          const data = await response.json();
          articles = data.articles || [];
        }
      } else if (NEWS_API_KEY) {
        provider = "newsapi";
        const searchUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&apiKey=${NEWS_API_KEY}`;
        console.log(`[API] Fetching search query "${query}" from NewsAPI.org`);
        const response = await fetch(searchUrl);
        if (response.ok) {
          const data = await response.json();
          articles = data.articles || [];
        }
      }

      // Live search fallback using Google News RSS search
      if (articles.length === 0) {
        provider = "google_rss";
        const cCode = country.toUpperCase();
        const rssSearchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-${cCode}&gl=${cCode}&ceid=${cCode}:en`;
        console.log(`[API] Fetching live RSS search query "${query}" from Google News RSS`);
        const rssResp = await fetch(rssSearchUrl);
        if (rssResp.ok) {
          const xmlText = await rssResp.text();
          articles = parseGoogleNewsRss(xmlText, category);
        }
      }
    } else {
      // Fetch category/headlines news
      if (GNEWS_API_KEY) {
        provider = "gnews";
        const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=${country}&apikey=${GNEWS_API_KEY}`;
        console.log(`[API] Fetching category "${category}" from GNews API`);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          articles = data.articles || [];
        }
      } else if (NEWS_API_KEY) {
        provider = "newsapi";
        const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&country=${country}&apiKey=${NEWS_API_KEY}`;
        console.log(`[API] Fetching category "${category}" from NewsAPI.org`);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          articles = data.articles || [];
        }
      }

      // Live Google News RSS Feed if no API key or if API failed
      if (articles.length === 0) {
        provider = "google_rss";
        const cCode = country.toUpperCase();
        let rssCategoryUrl = `https://news.google.com/rss?hl=en-${cCode}&gl=${cCode}&ceid=${cCode}:en`;
        if (category && category !== "general") {
          rssCategoryUrl = `https://news.google.com/rss/headlines/section/topic/${category.toUpperCase()}?hl=en-${cCode}&gl=${cCode}&ceid=${cCode}:en`;
        }

        console.log(`[API] Fetching live category "${category}" from Google News RSS (${cCode})`);
        const rssResp = await fetch(rssCategoryUrl);
        if (rssResp.ok) {
          const xmlText = await rssResp.text();
          articles = parseGoogleNewsRss(xmlText, category);
        }
      }

      // Final backup: Saurav's static archive mirror
      if (articles.length === 0) {
        provider = "saurav";
        const backupUrl = `https://saurav.tech/NewsAPI/top-headlines/category/${category}/${country}.json`;
        console.log(`[API] Fetching category "${category}" from Saurav's Archive Mirror`);
        const response = await fetch(backupUrl);
        if (response.ok) {
          const data = await response.json();
          articles = data.articles || [];
        }
      }
    }

    // Normalize the articles so they share a standard schema on the client,
    // and enrich missing article images by checking the publisher page metadata.
    const normalizedArticles = await Promise.all(
      articles.map(async (art: any) => {
        const isGNews = provider === "gnews";
        const fallbackImage = getTopicImageUrl(category, art.title || "", art.source?.name || "");
        let img = isGNews ? art.image || "" : art.urlToImage || art.image || "";
        if (!img) {
          img = fallbackImage;
        }

        img = sanitizeImageUrl(img, fallbackImage);
        const finalImage = art.url && !isGoogleNewsUrl(art.url) ? await resolveArticleImage(art.url, img) : img;

        return {
          title: art.title || "",
          description: art.description || "",
          content: art.content || "",
          url: art.url || "",
          image: finalImage,
          publishedAt: art.publishedAt || "",
          source: {
            name: art.source?.name || "Global News",
            url: art.source?.url || "",
          },
        };
      })
    );

    res.json({
      status: "success",
      provider,
      count: normalizedArticles.length,
      articles: normalizedArticles,
    });
  } catch (error: any) {
    console.error("[API] Error fetching news:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to retrieve news articles.",
    });
  }
});

// API Route: AI bullet-point summarizing using Groq
app.post("/api/news/ai-summary", async (req, res) => {
  const { title, description, content } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Article title is required for summarizing." });
  }

  if (!process.env.GROQ_API_KEY) {
    console.warn("[API] GROQ_API_KEY is not set. Generating a local summary fallback.");
    return res.json({
      summary: buildFallbackSummary(title, description, content, "missing-key"),
      isRealAI: false,
      notice: "Preview mode: set GROQ_API_KEY to enable live AI summaries.",
    });
  }

  try {
    const articlePrompt = `
You are an expert news editor. Summarize the following news article into exactly 3 concise, punchy bullet points.
Return only raw JSON with a top-level array of 3 strings and no markdown formatting.

Article Details:
Title: ${title}
Description: ${description || "No description provided."}
Content Draft: ${content || "No detailed draft provided."}
`;

    const bullets = await generateGroqSummary(articlePrompt);

    res.json({
      summary: bullets.slice(0, 3),
      isRealAI: true,
    });
  } catch (error: any) {
    console.error("[API] Groq AI summarizer error:", error);
    const status = error?.status;
    const transientFailure = status === 429 || status === 500 || status === 503 || status === 504;

    if (transientFailure) {
      return res.json({
        summary: buildFallbackSummary(title, description, content, "temporary-unavailable"),
        isRealAI: false,
        notice: "Preview mode: Groq is temporarily unavailable, so this quick summary is generated locally for now.",
      });
    }

    return res.status(500).json({
      error: "Failed to generate AI summary. Try again later.",
    });
  }
});

function listenOnPort(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "0.0.0.0", () => resolve(port));

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        if (port >= 65535) {
          reject(error);
          return;
        }
        resolve(listenOnPort(port + 1));
        return;
      }

      reject(error);
    });
  });
}

// Start server function to handle development vs production
async function startServer() {
  // Setup Vite Dev Middleware or Serve Static Files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware integrated for Development");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Server] Serving static production files from dist/");
  }

  const listeningPort = await listenOnPort(Number(process.env.PORT || DEFAULT_PORT));
  console.log(`[Server] Live News full-stack application running on http://localhost:${listeningPort}`);
}

startServer().catch((error) => {
  console.error("[Server] Failed to start app:", error);
  process.exit(1);
});
