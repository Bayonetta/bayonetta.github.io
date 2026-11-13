"use client";

import type { Locale } from "@/i18n/types";
import { localizeTag } from "@/lib/tag-labels";

type TagItem = { name: string; count: number };

type TagFilterProps = {
  tags: TagItem[];
  active: string | null;
  onSelect: (tag: string | null) => void;
  allLabel: string;
  locale: Locale;
};

export function TagFilter({ tags, active, onSelect, allLabel, locale }: TagFilterProps) {
  return (
    <div
      data-od-id="tag-filter"
      className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5"
      role="group"
      aria-label={allLabel}
    >
      <button
        type="button"
        data-active={active === null}
        className="chip shrink-0 font-mono"
        onClick={() => onSelect(null)}
      >
        {allLabel}
      </button>
      {tags.map((tag) => (
        <button
          key={tag.name}
          type="button"
          data-active={active === tag.name}
          className="chip shrink-0"
          onClick={() => onSelect(active === tag.name ? null : tag.name)}
        >
          {localizeTag(tag.name, locale)} <span className="text-faint">{tag.count}</span>
        </button>
      ))}
    </div>
  );
}
