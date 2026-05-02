"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure nprogress globally
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

export default function NProgressProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Whenever the route changes (pathname or searchParams), NProgress finishes
    NProgress.done();

    return () => {
      // Start the progress bar when the route starts changing
      NProgress.start();
    };
  }, [pathname, searchParams]);

  return null;
}
