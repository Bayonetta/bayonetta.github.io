"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = {
  src: string;
  note?: string;
  alt?: string;
};

type ImageGalleryProps = {
  images: GalleryImage[];
  title?: string;
};

/**
 * Markdown 内嵌图集组件：
 *
 * <ImageGallery
 *   title="我的旅行"
 *   images={[
 *     { src: "/images/trip-1.jpg", note: "富士山下的清晨" },
 *     { src: "/images/trip-2.jpg", note: "河口湖边的落日" },
 *   ]}
 * />
 */
export function ImageGallery({ images, title }: ImageGalleryProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (!Array.isArray(images) || images.length === 0) return null;

  const scrollTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const slide = el.children[i] as HTMLElement | undefined;
    if (slide) {
      el.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    }
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    let idx = 0;
    for (let i = 0; i < children.length; i++) {
      if (children[i].offsetLeft <= el.scrollLeft + 24) idx = i;
    }
    setIndex(idx);
  };

  return (
    <div data-od-id="image-gallery" className="my-6">
      {title && <p className="mb-2 font-mono text-xs text-faint">{title}</p>}

      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1"
      >
        {images.map((img, i) => (
          <figure
            key={i}
            className="w-[min(85%,22rem)] shrink-0 snap-start"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface">
              <Image
                src={img.src}
                alt={img.alt ?? img.note ?? ""}
                fill
                sizes="(max-width: 768px) 85vw, 22rem"
                className="object-cover"
              />
            </div>
            {img.note && (
              <figcaption className="mt-1.5 text-xs leading-relaxed text-muted">
                <span className="mr-1.5 font-mono text-faint">
                  {String(i + 1).padStart(2, "0")}/{String(images.length).padStart(2, "0")}
                </span>
                {img.note}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-xs text-faint">
            {index + 1} / {images.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="上一张"
              disabled={index === 0}
              onClick={() => scrollTo(index - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="下一张"
              disabled={index >= images.length - 1}
              onClick={() => scrollTo(index + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
