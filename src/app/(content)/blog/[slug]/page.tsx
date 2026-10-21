import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostVariants } from "@/lib/api";
import { mdxOptions } from "@/lib/mdx";
import { PostView, type PostVariant } from "@/components/PostView";
import { ImageGallery } from "@/components/ImageGallery";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const variants = getPostVariants(params.slug);
  const first = variants.zh ?? Object.values(variants)[0];
  if (!first) return { title: "Not Found" };
  return {
    title: first.title,
    description: first.description,
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const variants = getPostVariants(params.slug);
  const langs = Object.keys(variants) as PostVariant["lang"][];

  if (langs.length === 0) {
    notFound();
  }

  // 服务端预渲染所有语言版本，交给客户端按语言切换显示
  const rendered: PostVariant[] = langs.map((lang) => {
    const post = variants[lang]!;
    return {
      lang,
      title: post.title,
      date: post.date,
      description: post.description,
      tags: post.tags,
      updated: post.updated,
      readingTime: post.readingTime,
      comments: post.comments,
      machineTranslated: post.machineTranslated,
      content: (
        <MDXRemote
          source={post.content}
          options={mdxOptions}
          components={{ ImageGallery }}
        />
      ),
    };
  });

  return <PostView variants={rendered} />;
}
