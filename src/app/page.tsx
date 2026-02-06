import { FileText, FolderKanban, Github, Image as ImageIcon, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
           src="/images/abstract-1.jpg"
           alt="Background"
           fill
           className="object-cover opacity-60"
           priority
        />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center space-y-8 text-center">
        {/* Avatar */}
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl">
          <img
            src="https://avatars.githubusercontent.com/u/3266065?s=400&u=e1a094c5bde69f256d63cb5220fd3badd0979aaf&v=4"
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Name */}
        <h1 className="font-serif text-4xl font-bold tracking-wider text-white md:text-5xl">
          Bayonetta
        </h1>

        {/* Quote */}
        <div className="font-serif text-lg text-gray-200 md:text-xl">
          <p>非淡泊无以明志，非宁静无以致远。</p>
          <p className="mt-2 text-right text-sm">—— 诸葛孔明</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-8">
          <NavButton href="https://github.com/Bayonetta" icon={Github} label="Github" />
          <NavButton href="/blog" icon={FileText} label="Blog" />
          <NavButton href="https://lyu-series.github.io/" icon={FolderKanban} label="Lyu 系列" />
          <NavButton href="/gallery" icon={ImageIcon} label="Gallery" />
          <NavButton href="/about" icon={Info} label="About" />
        </div>

        <footer className="absolute bottom-4 text-xs text-gray-400">
          © {new Date().getFullYear()} zs.dev. All rights reserved.
        </footer>
      </div>
    </main>
  );
}

function NavButton({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link 
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm transition-colors group-hover:bg-white/20">
        <Icon className="h-8 w-8 text-white" />
      </div>
      <span className="font-serif text-sm tracking-wide text-white opacity-80 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  )
}
