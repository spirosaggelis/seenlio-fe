'use client';

import { useEffect } from 'react';
import { trackCategoryBrowse } from '@/lib/analytics';

export default function CategoryBrowseTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackCategoryBrowse(slug);
  }, [slug]);
  return null;
}
