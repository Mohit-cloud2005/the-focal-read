import React, { useState } from "react";
import { Sparkles, Clock, ArrowUpRight, AlertCircle, Newspaper, Check, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Article, AISummaryResponse } from "../types";

interface NewsCardProps {
  article: Article;
  category: string;
}

// Helper to format relative time gracefully
function getRelativeTime(dateString: string): string {
  if (!dateString) return "Recently";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (isNaN(diffMs) || diffMs < 0) return "Recently";

    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 60) {
      return diffMin <= 1 ? "Just now" : `${diffMin}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
  } catch (err) {
    return "Recently";
  }
}

// Topic photo helper for client-side fallback
const CLIENT_TOPIC_PHOTOS: Record<string, string[]> = {
  business: [
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  ],
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80",
  ],
  sports: [
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
  ],
  science: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80",
  ],
  health: [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=800&q=80",
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
  ],
};

const CLIENT_KEYWORD_MAP = [
  { kw: ["ai", "artificial intelligence", "nvidia", "chatgpt", "gemini", "openai", "robot", "robotics", "chip", "gpu", "semiconductor", "llm"], url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80" },
  { kw: ["apple", "iphone", "macbook", "ipad", "ios", "iphone", "airpods"], url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80" },
  { kw: ["google", "android", "pixel", "alphabet", "search engine", "chrome"], url: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=800&q=80" },
  { kw: ["space", "nasa", "mars", "moon", "rocket", "spacex", "satellite", "launch", "astronaut"], url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
  { kw: ["stock", "stocks", "wall street", "fed", "inflation", "market", "nasdaq", "dow", "rates", "economy", "oil", "diesel", "gasoline", "energy", "commodity"], url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80" },
  { kw: ["crypto", "bitcoin", "ethereum", "blockchain", "token", "wallet"], url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" },
  { kw: ["football", "soccer", "champions league", "premier league", "messi", "ronaldo", "transfer"], url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80" },
  { kw: ["cricket", "ipl", "test match", "bcci", "wicket", "tournament"], url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80" },
  { kw: ["basketball", "nba", "lakers", "playoff"], url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80" },
  { kw: ["tennis", "wimbledon", "grand slam"], url: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80" },
  { kw: ["election", "president", "biden", "trump", "vote", "congress", "white house", "parliament", "minister", "summit", "g7", "sanction", "policy", "officials", "government", "agency", "department", "update"], url: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80" },
  { kw: ["court", "judge", "lawsuit", "legal", "supreme court", "police", "crime", "trial", "investigation", "rape", "suspect", "victim", "probe"], url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80" },
  { kw: ["war", "military", "defense", "army", "missile", "strike", "conflict", "troops"], url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80" },
  { kw: ["doctor", "hospital", "cancer", "fda", "vaccine", "medicine", "health", "clinic"], url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" },
  { kw: ["climate", "weather", "storm", "hurricane", "earthquake", "environment", "wildfire", "flood", "heatwave"], url: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=800&q=80" },
  { kw: ["car", "electric vehicle", "ev", "tesla", "automotive", "battery", "auto"], url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80" },
  { kw: ["flight", "airline", "airport", "boeing", "aviation", "plane", "travel"], url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80" },
  { kw: ["gaming", "esports", "playstation", "xbox", "nintendo"], url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80" },
  { kw: ["movie", "cinema", "film", "hollywood", "netflix", "oscar", "actor"], url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80" },
  { kw: ["music", "concert", "grammy", "singer", "album", "festival"], url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80" },
  { kw: ["startup", "ceo", "business", "bank", "finance", "company", "merger"], url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80" },
];

function getFallbackTopicImage(cat: string, title: string = "", sourceName: string = ""): string {
  const text = `${title || ""} ${sourceName || ""} ${cat || "general"}`.toLowerCase();
  let bestMatch: { url: string; score: number } | null = null;

  for (const item of CLIENT_KEYWORD_MAP) {
    let score = 0;

    for (const keyword of item.kw) {
      const normalized = keyword.toLowerCase();
      if (!text.includes(normalized)) continue;

      score += normalized.includes(" ") ? 3 : 2;
      if ((title || "").toLowerCase().includes(normalized)) score += 2;
      if ((sourceName || "").toLowerCase().includes(normalized)) score += 1;
      if ((cat || "general").toLowerCase() === normalized) score += 4;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { url: item.url, score };
    }
  }

  if (bestMatch) {
    return bestMatch.url;
  }

  const key = (cat || "general").toLowerCase();
  const photos = CLIENT_TOPIC_PHOTOS[key] || CLIENT_TOPIC_PHOTOS.general;
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return photos[Math.abs(hash + title.length + key.length + sourceName.length) % photos.length];
}

export default function NewsCard({ article, category }: NewsCardProps) {
  const [summaryData, setSummaryData] = useState<AISummaryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayImage = !imageError && article.image
    ? article.image
    : getFallbackTopicImage(category, article.title, article.source?.name || "");

  // Dynamic fallback background for articles without working images
  const getFallbackGradient = () => {
    const initials = article.source?.name?.charAt(0) || "N";
    const colors = [
      "from-blue-400 to-indigo-600",
      "from-rose-400 to-red-600",
      "from-amber-400 to-orange-600",
      "from-emerald-400 to-teal-600",
      "from-purple-400 to-indigo-600",
    ];
    // Hash initials to pick a deterministic color
    const index = Math.abs(initials.charCodeAt(0) % colors.length);
    return colors[index];
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(article.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleToggleSummary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showSummary) {
      setShowSummary(false);
      return;
    }

    setShowSummary(true);

    if (summaryData) return; // Summary is already cached, no need to refetch

    setIsLoadingSummary(true);
    setSummaryError(null);

    try {
      const response = await fetch("/api/news/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          description: article.description,
          content: article.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data: AISummaryResponse = await response.json();
      setSummaryData(data);
    } catch (err: any) {
      console.error(err);
      setSummaryError("AI summary unavailable. Try again.");
      setShowSummary(false);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <article
      id={`news-card-${article.title.slice(0, 15).replace(/\s+/g, "-")}`}
      className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group"
    >
      {/* Clickable Media Cover / Image */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative h-48 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden block group/img"
        title="Click to view article on publisher website"
      >
        <img
          src={displayImage}
          alt={article.title}
          referrerPolicy="no-referrer"
          onError={() => {
            if (!imageError) setImageError(true);
          }}
          className="w-full h-full object-cover group-hover/img:scale-108 transition-transform duration-500"
        />

        {/* Hover overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover/img:translate-y-0 transition-transform duration-300">
            <span>Read on {article.source?.name || "Publisher"}</span>
            <ArrowUpRight size={13} />
          </span>
        </div>

        {/* Floating Category & Date Tags */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
          <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold rounded-full uppercase tracking-wider shadow-sm">
            {category}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-black/55 backdrop-blur-md text-slate-100 text-xs rounded-full shadow-sm z-10">
          <Clock size={11} />
          <span>{getRelativeTime(article.publishedAt)}</span>
        </div>
      </a>

      {/* Content details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* News Source Publisher */}
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {article.source?.name || "Global News"}
            </span>
            <button
              onClick={handleCopyLink}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
              title="Copy article link"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
            </button>
          </div>

          {/* Clickable Heading */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group/title"
          >
            <h3 className="font-bold text-slate-900 dark:text-slate-50 line-clamp-2 leading-snug group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors text-base cursor-pointer">
              {article.title}
            </h3>
          </a>

          {/* Clickable Description Text */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">
              {article.description || "Click to explore this breaking news story detailed on the publisher website."}
            </p>
          </a>
        </div>

        {/* Expandable/Collapsible AI Bullet Summary */}
        <AnimatePresence initial={false}>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-900 text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Sparkles size={13} className="text-purple-500 animate-pulse" />
                    <span>AI Key Insights</span>
                  </div>
                  {summaryData && !summaryData.isRealAI && (
                    <div className="flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      <AlertCircle size={10} />
                      <span>Preview Mode</span>
                    </div>
                  )}
                </div>

                {isLoadingSummary ? (
                  <div className="space-y-2.5 animate-pulse">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-11/12" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
                  </div>
                ) : summaryError ? (
                  <div className="text-xs text-rose-500 flex items-center gap-1.5 py-1">
                    <AlertCircle size={12} />
                    <span>{summaryError}</span>
                  </div>
                ) : (
                  <>
                    <ul className="space-y-2 pl-1">
                      {summaryData?.summary.map((bullet, idx) => (
                        <li key={idx} className="flex gap-2 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          <span className="text-purple-400 select-none font-medium mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    {summaryData && !summaryData.isRealAI && summaryData.notice && (
                      <div className="pt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        {summaryData.notice}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-50 dark:border-slate-900/50">
          <button
            onClick={handleToggleSummary}
            disabled={isLoadingSummary}
            className={`flex-1 h-10 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              showSummary
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/40 border border-purple-200/50 dark:border-purple-800/30"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-100 dark:border-slate-800"
            }`}
          >
            <Sparkles size={13} className={showSummary ? "text-purple-500 shrink-0" : "text-slate-400 shrink-0"} />
            <span>{showSummary ? "Close AI Brief" : "AI Bullet Points"}</span>
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-10 flex items-center justify-center gap-1.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm"
            title="Read complete article on publisher website"
          >
            <span>Full Story</span>
            <ArrowUpRight size={14} className="shrink-0" />
          </a>
        </div>
      </div>
    </article>
  );
}

