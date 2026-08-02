import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Gallery",
};

type GalleryItem = {
  src: string;
  title?: string;
  note?: string;
  date?: string;
};

function getGalleryItems(): GalleryItem[] {
  try {
    const file = path.join(process.cwd(), "content/gallery/manifest.json");
    const raw = fs.readFileSync(file, "utf8");
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export default function GalleryPage() {
  const items = getGalleryItems();
  const hint = `$ echo '{"src":"/images/your.jpg","note":"…"}' >> content/gallery/manifest.json`;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader section="gallery" />

      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <p className="font-mono text-sm text-muted">gallery: empty</p>
          <p className="font-mono text-xs leading-relaxed text-faint">{hint}</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((item, i) => (
            <figure
              key={i}
              data-od-id={`gallery-item-${i}`}
              className="mb-4 break-inside-avoid"
            >
              <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
                <Image
                  src={item.src}
                  alt={item.title ?? item.note ?? ""}
                  width={800}
                  height={600}
                  className="h-auto w-full object-cover"
                />
              </div>
              <figcaption className="mt-1.5 space-y-0.5 px-0.5">
                {item.title && (
                  <p className="font-mono text-xs text-fg">{item.title}</p>
                )}
                {item.note && <p className="text-xs text-muted">{item.note}</p>}
                {item.date && (
                  <p className="font-mono text-[11px] text-faint">{item.date}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
