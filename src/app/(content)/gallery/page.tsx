import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { GalleryGrid } from "@/components/GalleryGrid";

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
      <GalleryGrid items={items} emptyHint={hint} />
    </div>
  );
}
