"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryItem = {
  src: string;
  title?: string;
  note?: string;
  date?: string;
};

type GalleryGridProps = {
  items: GalleryItem[];
  emptyTitle?: string;
  emptyHint?: string;
};

export function GalleryGrid({ items, emptyTitle, emptyHint }: GalleryGridProps) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(
    () => setActive((a) => (a === null ? a : (a + items.length - 1) % items.length)),
    [items.length],
  );
  const next = useCallback(
    () => setActive((a) => (a === null ? a : (a + 1) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, prev, next]);

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <p className="font-mono text-sm text-muted">{emptyTitle ?? "gallery: empty"}</p>
        {emptyHint && <p className="font-mono text-xs leading-relaxed text-faint">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <>
      {/* 瀑布流 */}
      <div data-od-id="gallery-grid" className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.map((item, i) => (
          <figure
            key={i}
            data-od-id={`gallery-item-${i}`}
            className="group mb-4 break-inside-avoid"
          >
            <button
              type="button"
              onClick={() => setActive(i)}
              className="block w-full overflow-hidden rounded-lg border border-line bg-surface text-left transition-colors group-hover:border-accent"
              aria-label={item.title ?? item.note ?? `图片 ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.title ?? item.note ?? ""}
                loading="lazy"
                className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </button>
            <figcaption className="mt-1.5 space-y-0.5 px-0.5">
              {(item.title || item.date) && (
                <div className="flex items-baseline justify-between gap-2">
                  {item.title && (
                    <p className="font-mono text-xs text-fg">{item.title}</p>
                  )}
                  {item.date && (
                    <p className="shrink-0 font-mono text-[11px] text-faint">
                      {item.date}
                    </p>
                  )}
                </div>
              )}
              {item.note && <p className="text-xs text-muted">{item.note}</p>}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* 灯箱 */}
      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={items[active].title ?? "图片预览"}
          className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
          onClick={close}
        >
          {/* 顶部：计数器 + 关闭 */}
          <div
            className="flex items-center justify-between px-5 py-4 text-sm text-white/70"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono">
              {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              aria-label="关闭"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 图片 */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden px-12 sm:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[active].src}
              alt={items[active].title ?? items[active].note ?? ""}
              className="max-h-full max-w-full object-contain"
            />
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="上一张"
                  onClick={prev}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/50 hover:text-white sm:left-4"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="下一张"
                  onClick={next}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/50 hover:text-white sm:right-4"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* 底部：标题 + 备注 */}
          <div
            className="px-6 pb-6 pt-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {items[active].title && (
              <p className="font-mono text-sm text-white">{items[active].title}</p>
            )}
            {items[active].note && (
              <p className="mt-1 text-sm text-white/70">{items[active].note}</p>
            )}
            {items[active].date && (
              <p className="mt-1 font-mono text-xs text-white/40">{items[active].date}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
