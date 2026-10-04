import React, { useState, useEffect } from "react";
import {
  Newspaper,
  Search,
  Moon,
  Sun,
  RefreshCw,
  X,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { Article, Category } from "./types";
import CategoryFilter from "./components/CategoryFilter";
import CountrySelector from "./components/CountrySelector";
import NewsCard from "./components/NewsCard";
import LoadingSkeleton from "./components/LoadingSkeleton";

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("general");
  const [activeCountry, setActiveCountry] = useState("us");
  const [searchVal, setSearchVal] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [provider, setProvider] = useState("saurav");

  // Load and sync theme configuration
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("news-theme");
      if (savedTheme) return savedTheme === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("news-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("news-theme", "light");
    }
  }, [isDark]);

  // Main news fetch function
  const fetchNews = async (
    category: Category,
    country: string,
    query: string
  ) => {
    setLoading(true);
    setApiError(null);
    try {
      let url = `/api/news?category=${category}&country=${country}`;
      if (query) {
        url += `&query=${encodeURIComponent(query)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load articles (Status ${response.status})`);
      }

      const data = await response.json();
      if (data.status === "success") {
        setArticles(data.articles);
        setProvider(data.provider || "saurav");
      } else {
        throw new Error(data.message || "Failed to retrieve articles");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger news fetch on changes
  useEffect(() => {
    fetchNews(activeCategory, activeCountry, submittedQuery);
  }, [activeCategory, activeCountry, submittedQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchVal.trim());
  };

  const handleClearSearch = () => {
    setSearchVal("");
    setSubmittedQuery("");
  };

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    // Clearing search on category changes creates a smoother experience unless searching
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Upper Brand Nav Rail */}
      <header className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-2 select-none shrink-0" id="brand-logo-section">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <Newspaper size={18} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                The Focal READ
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Curated Global Intelligence
              </p>
            </div>
          </div>

          {/* Quick Search Panel */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-md relative"
            id="desktop-search-form"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search keywords, events or publications..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 focus:border-blue-500 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none transition-all shadow-inner placeholder:text-slate-400"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Controls Hub */}
          <div className="flex items-center gap-2.5">
            {/* Country Dropdown Selector */}
            <CountrySelector
              activeCountry={activeCountry}
              onCountryChange={(code) => {
                setActiveCountry(code);
                // Clear query on country change to keep it intuitive
                handleClearSearch();
              }}
            />

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-all shadow-sm flex items-center gap-1.5"
              aria-label="Toggle visual palette"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              id="theme-toggler"
            >
              {isDark ? (
                <>
                  <Sun size={16} className="text-amber-400 fill-amber-400/20" />
                  <span className="text-xs font-semibold hidden sm:inline text-amber-500 dark:text-amber-400">Light</span>
                </>
              ) : (
                <>
                  <Moon size={16} className="text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-semibold hidden sm:inline text-slate-700 dark:text-slate-300">Dark</span>
                </>
              )}
            </button>

            {/* Refresh Live Feed */}
            <button
              onClick={() => fetchNews(activeCategory, activeCountry, submittedQuery)}
              disabled={loading}
              className="p-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-all shadow-sm disabled:opacity-40"
              aria-label="Refresh headline feed"
              id="refresh-feed-btn"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-blue-500" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Mobile Search Widget (Only visible on small viewports) */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex md:hidden items-center relative"
          id="mobile-search-form"
        >
          <div className="relative w-full shadow-sm rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 focus:border-blue-500 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchVal && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Category filtering tab strip */}
        <div className="bg-white/40 dark:bg-slate-950/25 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/40">
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Dynamic header summary or query summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={18} />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {submittedQuery ? `Search: "${submittedQuery}"` : `${activeCategory} Highlights`}
              </h2>
            </div>
          </div>
        </div>

        {/* Display Error Message Banner if present */}
        {apiError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex gap-3 text-rose-800 dark:text-rose-300">
            <AlertCircle className="shrink-0 text-rose-500" size={20} />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Failed to Sync Live Feed</p>
              <p className="text-xs opacity-90">{apiError}</p>
            </div>
          </div>
        )}

        {/* Main Feed View Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : articles.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4" id="empty-state-view">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <HelpCircle size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                No articles discovered
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                We couldn't locate any stories matching &ldquo;{submittedQuery || activeCategory}&rdquo; in this edition. Try searching with alternative terms or change category views.
              </p>
            </div>
            {(submittedQuery || activeCategory !== "general") && (
              <button
                onClick={() => {
                  handleClearSearch();
                  setActiveCategory("general");
                }}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold shadow transition-all"
              >
                Reset Feed Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article, idx) => (
              <motion.div
                key={`${article.url}-${idx}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
              >
                <NewsCard article={article} category={activeCategory} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Clean end-user facing footer */}
      <footer className="border-t border-slate-100 dark:border-slate-900/60 mt-16 bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 transition-colors py-8 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            The Focal READ
          </p>
          <p className="max-w-md mx-auto leading-relaxed">
            Real-time breaking headlines, AI-powered key takeaways, and comprehensive worldwide news coverage.
          </p>
          <div className="pt-4 text-[11px] opacity-80">
            © {new Date().getFullYear()} The Focal READ. All coverage rights reserved by original news publishers.
          </div>
        </div>
      </footer>
    </div>
  );
}
