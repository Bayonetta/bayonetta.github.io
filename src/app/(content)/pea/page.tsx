import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { peaProducts } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pea 系列",
};

export default function PeaPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader section="pea" />

      {peaProducts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
          <p className="font-mono text-sm text-muted">pea: pending</p>
          <p className="font-mono text-xs text-faint">
            $ pea add --name PeaScribe --desc "字幕生成器"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {peaProducts.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className="card group flex items-center justify-between p-5 transition-colors hover:border-accent"
            >
              <div>
                <h3 className="font-mono text-base font-semibold">{p.name}</h3>
                <p className="mt-0.5 text-sm text-muted">{p.desc}</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-faint transition-colors group-hover:text-accent" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
