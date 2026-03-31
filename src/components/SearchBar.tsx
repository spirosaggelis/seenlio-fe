"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  placeholder?: string;
  size?: "md" | "lg";
  onSearch?: (query: string) => void;
  loading?: boolean;
}

export default function SearchBar({
  placeholder = "Enter product code (e.g. VP-1234)",
  size = "lg",
  onSearch,
  loading: externalLoading,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const router = useRouter();

  const isLoading = externalLoading ?? internalLoading;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (onSearch) {
      onSearch(trimmed.toUpperCase());
    } else {
      setInternalLoading(true);
      router.push(`/lookup?code=${encodeURIComponent(trimmed.toUpperCase())}`);
    }
  };

  const sizeClasses = {
    md: {
      wrapper: "max-w-md",
      input: "px-4 py-3 text-sm pl-10",
      icon: "left-3 w-4 h-4",
      button: "px-5 py-3 text-sm",
    },
    lg: {
      wrapper: "max-w-2xl",
      input: "px-6 py-4 text-base sm:text-lg pl-14 font-mono tracking-wider",
      icon: "left-4 sm:left-5 w-5 h-5",
      button: "px-6 sm:px-8 py-4 text-base",
    },
  };

  const s = sizeClasses[size];

  return (
    <form
      onSubmit={handleSubmit}
      className={`${s.wrapper} w-full mx-auto`}
    >
      <div className="relative group">
        {/* Glow effect behind the input */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 rounded-2xl opacity-0 group-focus-within:opacity-50 blur-md transition-opacity duration-500 animate-gradient-shift bg-[length:200%_auto]" />

        <div className="relative flex items-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden group-focus-within:border-purple-500/50 transition-colors duration-300">
          {/* Search icon */}
          <svg
            className={`absolute ${s.icon} text-gray-500 group-focus-within:text-purple-400 transition-colors duration-300 pointer-events-none`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={10}
            className={`${s.input} w-full bg-transparent text-white placeholder-gray-600 outline-none disabled:opacity-50`}
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`${s.button} shrink-0 mr-1.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching
              </span>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
