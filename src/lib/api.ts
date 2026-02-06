import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export type Post = {
  slug: string;
  title: string;
  date: string;
  content: string;
  description?: string;
  tags?: string[];
  [key: string]: any;
};

export function getPostSlugs() {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string, fields: string[] = []): Post | null {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);
  
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Parse date from filename if not present in frontmatter
  // Filename format: YYYY-M-D-Title.md 或 YYYY-MM-DD-Title.md 都支持
  const fileNameMatch = realSlug.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(.+)$/);
  let dateFromFileName = '';
  
  if (fileNameMatch) {
      const [, year, month, day] = fileNameMatch;
      const mm = month.padStart(2, '0');
      const dd = day.padStart(2, '0');
      dateFromFileName = `${year}-${mm}-${dd}`;
  }

  const items: any = {};

  // Ensure minimum fields
  items.slug = realSlug;
  items.content = content;
  
  // Merge frontmatter
  Object.keys(data).forEach((key) => {
      items[key] = data[key];
  });

  // Fallback for date
  if (!items.date && dateFromFileName) {
      items.date = dateFromFileName;
  }
  
  // Fallback for title (from filename)
  if (!items.title && fileNameMatch) {
      const rawTitle = fileNameMatch[4];
      items.title = rawTitle.replace(/_/g, ' ');
  }

  return items as Post;
}

export function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .filter((post): post is Post => post !== null)
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
