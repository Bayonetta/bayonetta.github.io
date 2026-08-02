import type { Metadata } from "next";
import { getAllPosts } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ProfileCard } from "@/components/ProfileCard";
import { BlogBrowser } from "@/components/BlogBrowser";

export const metadata: Metadata = {
  title: "Blog",
  description: "技术笔记 · 项目记录 · 随笔",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader section="blog" />
      <ProfileCard />
      <div className="mt-8">
        <BlogBrowser posts={posts} />
      </div>
    </div>
  );
}
