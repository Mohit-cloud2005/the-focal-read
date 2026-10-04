import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { CountryOption } from "../types";

const COUNTRIES: CountryOption[] = [
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "in", name: "India", flag: "🇮🇳" },
  { code: "gb", name: "United Kingdom", flag: "🇬🇧" },
  { code: "au", name: "Australia", flag: "🇦🇺" },
  { code: "fr", name: "France", flag: "🇫🇷" },
  { code: "ru", name: "Russia", flag: "🇷🇺" },
];

interface CountrySelectorProps {
  activeCountry: string;
  onCountryChange: (countryCode: string) => void;
}

export default function CountrySelector({
  activeCountry,
  onCountryChange,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === activeCountry) || COUNTRIES[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} id="country-selector-wrapper">
      <button
        id="country-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-200 transition-all shadow-sm"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="hidden sm:inline">{selectedCountry.name}</span>
        <span className="sm:hidden uppercase">{selectedCountry.code}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Edition Language
          </div>
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              id={`country-opt-${country.code}`}
              onClick={() => {
                onCountryChange(country.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
                activeCountry === country.code
                  ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{country.flag}</span>
                <span>{country.name}</span>
              </div>
              {activeCountry === country.code && (
                <Check size={14} className="text-slate-900 dark:text-white" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
