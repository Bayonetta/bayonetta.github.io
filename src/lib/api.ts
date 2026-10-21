import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Locale } from "@/i18n/types";

const postsDirectory = path.join(process.cwd(), "content/posts");
const LOCALES: readonly string[] = ["zh", "en", "ja"];

export type PostMeta = {
  slug: string; // 基础 slug（不含语言后缀），用于 URL
  locale: Locale;
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  tags: string[];
  category?: string;
  updated?: string;
  comments?: boolean;
  /** 该语言版本是否由机器翻译工具生成（zh 原文缺省为 false） */
  machineTranslated?: boolean;
  readingTime: number;
  /** 纯文本化后的正文片段，用于客户端搜索 */
  searchText: string;
};

export type Post = PostMeta & { content: string };

function parseFileName(file: string): { base: string; locale: Locale } {
  const noExt = file.replace(/\.md$/, "");
  const parts = noExt.split(".");
  const last = parts[parts.length - 1];
  if (LOCALES.includes(last)) {
    return { base: parts.slice(0, -1).join("."), locale: last as Locale };
  }
  return { base: noExt, locale: "zh" };
}

function dateFromFileName(base: string): string {
  const m = base.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadingTime(text: string): number {
  const cjk = (text.match(/[一-鿿぀-ヿ]/g) || []).length;
  const latin = (text.replace(/[一-鿿぀-ヿ]/g, " ").match(/\S+/g) || []).length;
  const minutes = Math.ceil(cjk / 400 + latin / 200);
  return Math.max(1, minutes);
}

function toMeta(file: string): PostMeta | null {
  const { base, locale } = parseFileName(file);
  const fullPath = path.join(postsDirectory, file);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  const fileDate = dateFromFileName(base);
  const date = (data.date as string) || fileDate || "";

  const clean = stripMarkdown(content);
  const title =
    (data.title as string) ||
    base.replace(/^\d{4}-\d{1,2}-\d{1,2}-/, "").replace(/_/g, " ");

  return {
    slug: base,
    locale,
    title,
    date,
    description: (data.description as string) || clean.slice(0, 160) || undefined,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    category: data.category as string | undefined,
    updated: data.updated as string | undefined,
    comments: data.comments as boolean | undefined,
    machineTranslated: data.machineTranslated === true,
    readingTime: estimateReadingTime(content),
    searchText: clean.slice(0, 3000),
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map(toMeta)
    .filter((p): p is PostMeta => p !== null && !!p.date)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

/** 按基础 slug 获取文章的所有语言版本 */
export function getPostVariants(
  slug: string,
): Partial<Record<Locale, Post>> {
  if (!fs.existsSync(postsDirectory)) return {};
  const files = fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".md"));
  const result: Partial<Record<Locale, Post>> = {};

  for (const file of files) {
    const { base, locale } = parseFileName(file);
    if (base !== slug) continue;
    const meta = toMeta(file);
    if (!meta) continue;
    const raw = fs.readFileSync(path.join(postsDirectory, file), "utf8");
    const { content } = matter(raw);
    result[locale] = { ...meta, content };
  }
  return result;
}

/** 所有基础 slug 列表（用于 generateStaticParams） */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return Array.from(
    new Set(
      fs
        .readdirSync(postsDirectory)
        .filter((f) => f.endsWith(".md"))
        .map((f) => parseFileName(f).base),
    ),
  );
}

/** 汇总所有标签及出现次数 */
export function getAllTags(posts: PostMeta[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const tag of p.tags) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
}
