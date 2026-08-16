"use client";

import { useEffect, useRef } from "react";

export function ReadingProgress() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const scrollableHeight = scrollingElement.scrollHeight - scrollingElement.clientHeight;
      const progress = scrollableHeight > 0
        ? Math.min(1, Math.max(0, scrollingElement.scrollTop / scrollableHeight))
        : 1;

      progressRef.current?.style.setProperty("--reading-progress", String(progress));
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.body);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    update();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return <div ref={progressRef} className="reader-progress" aria-hidden="true" />;
}
