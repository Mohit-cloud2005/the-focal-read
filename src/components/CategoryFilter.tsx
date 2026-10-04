import { motion } from "motion/react";
import {
  Globe,
  Briefcase,
  Film,
  HeartPulse,
  Atom,
  Trophy,
  Cpu,
} from "lucide-react";
import { Category } from "../types";

interface CategoryFilterProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const CATEGORIES: { value: Category; label: string; icon: any; color: string }[] = [
  { value: "general", label: "General", icon: Globe, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
  { value: "business", label: "Business", icon: Briefcase, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
  { value: "entertainment", label: "Entertainment", icon: Film, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/30" },
  { value: "health", label: "Health", icon: HeartPulse, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/30" },
  { value: "science", label: "Science", icon: Atom, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" },
  { value: "sports", label: "Sports", icon: Trophy, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
  { value: "technology", label: "Technology", icon: Cpu, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30" },
];

export default function CategoryFilter({
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex space-x-2 md:space-x-3 px-1 min-w-max">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.value;

          return (
            <button
              key={cat.value}
              id={`cat-btn-${cat.value}`}
              onClick={() => onCategoryChange(cat.value)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategoryBg"
                  className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`p-1 rounded-lg ${isActive ? "text-slate-900 bg-white" : cat.color}`}>
                <Icon size={16} />
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
