import React from 'react';

interface CategoryIconProps {
  slug: string;
  className?: string;
}

const icons: Record<string, React.ReactElement> = {
  "outdoor-travel": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 6L8 38h32L24 6z" fill="url(#ot1)" opacity="0.9"/>
      <path d="M24 6L16 38h16L24 6z" fill="url(#ot2)" opacity="0.7"/>
      <circle cx="24" cy="34" r="3" fill="white" opacity="0.9"/>
      <path d="M10 42h28" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      <defs>
        <linearGradient id="ot1" x1="8" y1="6" x2="40" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399"/>
          <stop offset="1" stopColor="#059669"/>
        </linearGradient>
        <linearGradient id="ot2" x1="16" y1="6" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6ee7b7"/>
          <stop offset="1" stopColor="#10b981"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "gadgets-tech": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="32" height="22" rx="3" fill="url(#gt1)"/>
      <rect x="11" y="13" width="26" height="16" rx="1.5" fill="#0f172a" opacity="0.6"/>
      <rect x="18" y="32" width="12" height="3" rx="1.5" fill="url(#gt1)" opacity="0.7"/>
      <rect x="15" y="35" width="18" height="2" rx="1" fill="url(#gt1)" opacity="0.5"/>
      <circle cx="35" cy="18" r="2" fill="#60a5fa" opacity="0.9"/>
      <path d="M16 21l3 3 6-6" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="gt1" x1="8" y1="10" x2="40" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8"/>
          <stop offset="1" stopColor="#6366f1"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "home-tools": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 8L6 22h4v16h28V22h4L24 8z" fill="url(#ht1)"/>
      <rect x="18" y="28" width="12" height="10" rx="1.5" fill="#0f172a" opacity="0.5"/>
      <rect x="21" y="28" width="2" height="10" fill="white" opacity="0.15"/>
      <circle cx="24" cy="33" r="1.5" fill="white" opacity="0.5"/>
      <defs>
        <linearGradient id="ht1" x1="6" y1="8" x2="42" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c"/>
          <stop offset="1" stopColor="#ea580c"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "kitchen-tools": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8v14c0 3.3 2.7 6 6 6h.5V40h3V28h.5c3.3 0 6-2.7 6-6V8" stroke="url(#kt1)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 8v8" stroke="url(#kt1)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M13 8c0 4 3 8 3 14" stroke="url(#kt1)" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <circle cx="24" cy="22" r="8" fill="url(#kt2)" opacity="0.2"/>
      <defs>
        <linearGradient id="kt1" x1="13" y1="8" x2="34" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6"/>
          <stop offset="1" stopColor="#db2777"/>
        </linearGradient>
        <linearGradient id="kt2" x1="16" y1="14" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f9a8d4"/>
          <stop offset="1" stopColor="#ec4899"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "car-accessories": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="20" width="36" height="14" rx="4" fill="url(#ca1)"/>
      <path d="M12 20l4-8h16l4 8" fill="url(#ca2)"/>
      <rect x="8" y="26" width="8" height="5" rx="2" fill="#0f172a" opacity="0.5"/>
      <rect x="32" y="26" width="8" height="5" rx="2" fill="#0f172a" opacity="0.5"/>
      <circle cx="14" cy="36" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="2"/>
      <circle cx="14" cy="36" r="1.5" fill="#94a3b8"/>
      <circle cx="34" cy="36" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="2"/>
      <circle cx="34" cy="36" r="1.5" fill="#94a3b8"/>
      <rect x="20" y="23" width="8" height="4" rx="1.5" fill="#7dd3fc" opacity="0.7"/>
      <defs>
        <linearGradient id="ca1" x1="6" y1="20" x2="42" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa"/>
          <stop offset="1" stopColor="#2563eb"/>
        </linearGradient>
        <linearGradient id="ca2" x1="12" y1="12" x2="36" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93c5fd"/>
          <stop offset="1" stopColor="#3b82f6"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "lifestyle-personal": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 10c-7.7 0-14 6.3-14 14 0 5.2 2.8 9.7 7 12.1L24 40l7-3.9c4.2-2.4 7-6.9 7-12.1 0-7.7-6.3-14-14-14z" fill="url(#lp1)"/>
      <path d="M18 24l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="lp1" x1="10" y1="10" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc"/>
          <stop offset="1" stopColor="#9333ea"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "fitness-health": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="20" width="8" height="8" rx="2" fill="url(#fh1)"/>
      <rect x="36" y="20" width="8" height="8" rx="2" fill="url(#fh1)"/>
      <rect x="10" y="16" width="6" height="16" rx="2" fill="url(#fh1)" opacity="0.8"/>
      <rect x="32" y="16" width="6" height="16" rx="2" fill="url(#fh1)" opacity="0.8"/>
      <rect x="16" y="21" width="16" height="6" rx="2" fill="url(#fh2)"/>
      <defs>
        <linearGradient id="fh1" x1="4" y1="20" x2="44" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f87171"/>
          <stop offset="1" stopColor="#dc2626"/>
        </linearGradient>
        <linearGradient id="fh2" x1="16" y1="21" x2="32" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fca5a5"/>
          <stop offset="1" stopColor="#ef4444"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "pet-products": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="28" rx="12" ry="10" fill="url(#pp1)"/>
      <ellipse cx="14" cy="16" rx="4" ry="5" fill="url(#pp1)" opacity="0.8"/>
      <ellipse cx="34" cy="16" rx="4" ry="5" fill="url(#pp1)" opacity="0.8"/>
      <ellipse cx="19" cy="30" rx="3" ry="2" fill="#0f172a" opacity="0.3"/>
      <ellipse cx="29" cy="30" rx="3" ry="2" fill="#0f172a" opacity="0.3"/>
      <path d="M21 34c1 1.5 5 1.5 6 0" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="27" r="2" fill="#0f172a" opacity="0.6"/>
      <circle cx="28" cy="27" r="2" fill="#0f172a" opacity="0.6"/>
      <defs>
        <linearGradient id="pp1" x1="10" y1="11" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24"/>
          <stop offset="1" stopColor="#d97706"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "office-desk": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="22" height="16" rx="2" fill="url(#od1)"/>
      <rect x="10" y="12" width="18" height="12" rx="1" fill="#0f172a" opacity="0.5"/>
      <rect x="30" y="10" width="10" height="16" rx="2" fill="url(#od1)" opacity="0.7"/>
      <rect x="6" y="28" width="36" height="3" rx="1.5" fill="url(#od2)"/>
      <rect x="12" y="31" width="3" height="8" rx="1" fill="url(#od2)" opacity="0.7"/>
      <rect x="33" y="31" width="3" height="8" rx="1" fill="url(#od2)" opacity="0.7"/>
      <path d="M14 18l3 3 5-5" stroke="#a5f3fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="od1" x1="8" y1="10" x2="40" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9"/>
          <stop offset="1" stopColor="#06b6d4"/>
        </linearGradient>
        <linearGradient id="od2" x1="6" y1="28" x2="42" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5f3fc"/>
          <stop offset="1" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  "cleaning-organization": (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="6" width="5" height="20" rx="2.5" fill="url(#co1)"/>
      <path d="M14 26h20l-3 14H17L14 26z" fill="url(#co2)"/>
      <path d="M12 26h24" stroke="url(#co1)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 32h8M19 36h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <defs>
        <linearGradient id="co1" x1="20" y1="6" x2="25" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#86efac"/>
          <stop offset="1" stopColor="#16a34a"/>
        </linearGradient>
        <linearGradient id="co2" x1="14" y1="26" x2="34" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80"/>
          <stop offset="1" stopColor="#15803d"/>
        </linearGradient>
      </defs>
    </svg>
  ),
};

const fallback = (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="16" fill="url(#fb1)" opacity="0.8"/>
    <path d="M18 24l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="fb1" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a78bfa"/>
        <stop offset="1" stopColor="#7c3aed"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function CategoryIcon({ slug, className = "w-10 h-10" }: CategoryIconProps) {
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const icon = icons[normalizedSlug] ?? fallback;
  return <span className={`block ${className}`}>{icon}</span>;
}
