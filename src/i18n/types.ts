export type Dict = {
  locale: string;
  langName: string;
  nav: Record<string, string>;
  hero: {
    whoami: string;
    whoamiOut: string;
    tagline: string;
    scrollHint: string;
  };
  blog: Record<string, string>;
  gallery: Record<string, string>;
  about: Record<string, string>;
  footer: Record<string, string>;
  pea: Record<string, string>;
  resume: Record<string, string>;
};

export type Locale = "zh" | "en" | "ja";

export const locales: Locale[] = ["zh", "en", "ja"];
