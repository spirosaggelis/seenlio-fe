"use client";

import { useState } from "react";
import Image from "next/image";

interface MediaItem {
  url: string;
  type?: "image" | "video";
  altText?: string;
  isPrimary?: boolean;
}

export default function ProductImageGallery({
  media,
  productName,
}: {
  media: MediaItem[];
  productName: string;
}) {
  const [selected, setSelected] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      </div>
    );
  }

  const current = media[selected];
  const isVideo = current.type === "video";

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/10">
        {isVideo ? (
          <video
            src={current.url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <Image
            src={current.url}
            alt={current.altText || productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-opacity duration-300"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/30 to-transparent pointer-events-none" />
        {isVideo && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Video
          </div>
        )}
      </div>

      {/* Thumbnail strip — show all, scroll horizontally if many */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {media.map((item, i) => {
            const isVid = item.type === "video";
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`relative flex-none w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  i === selected
                    ? "border-purple-500 ring-2 ring-purple-500/40"
                    : "border-white/10 hover:border-purple-400/50"
                }`}
              >
                {isVid ? (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <svg className="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.altText || `${productName} ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
