"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/analytics";

export default function ProductViewTracker({
  productCode,
}: {
  productCode: string;
}) {
  useEffect(() => {
    trackProductView(productCode);
  }, [productCode]);

  return null;
}
