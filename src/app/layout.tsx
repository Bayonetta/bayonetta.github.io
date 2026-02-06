import type { Metadata } from "next";
import { Inter, Noto_Serif_SC, Great_Vibes } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const notoSerif = Noto_Serif_SC({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-serif",
});
const greatVibes = Great_Vibes({ 
  subsets: ["latin"], 
  weight: ["400"],
  variable: "--font-great-vibes",
});

export const metadata: Metadata = {
  title: "ZHAO SHUAI",
  description: "Personal Website of ZHAO SHUAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${notoSerif.variable} ${greatVibes.variable}`}>
        {children}
      </body>
    </html>
  );
}
