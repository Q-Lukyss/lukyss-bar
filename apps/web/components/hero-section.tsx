import Image from "next/image";
import { stonePlaceholder } from "@/lib/blur";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Image de fond — cachée sur mobile */}
      <div className="absolute inset-0 hidden md:block">
        <Image
          src="/bar-artdeco.jpg"
          alt=""
          fill
          className="object-cover object-center"
          placeholder="blur"
          blurDataURL={stonePlaceholder}
          priority
          sizes="100vw"
        />
      </div>
      {/* Overlay — solide sur mobile, transparent sur desktop */}
      <div className="absolute inset-0 bg-stone-950 md:bg-stone-950/60" />

      {/* Cadre décoratif CSS art déco — caché sur mobile */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {/* Double bordure fine */}
        <div className="absolute inset-6 border border-amber-600/30" />
        <div className="absolute inset-[30px] border border-amber-700/15" />

        {/* Brackets de coins */}
        <div className="absolute left-4 top-4 h-12 w-12 border-l-2 border-t-2 border-amber-500/60" />
        <div className="absolute right-4 top-4 h-12 w-12 border-r-2 border-t-2 border-amber-500/60" />
        <div className="absolute bottom-4 left-4 h-12 w-12 border-b-2 border-l-2 border-amber-500/60" />
        <div className="absolute bottom-4 right-4 h-12 w-12 border-b-2 border-r-2 border-amber-500/60" />

        {/* Diamants aux coins */}
        <div className="absolute left-[18px] top-[18px] h-3 w-3 rotate-45 bg-amber-500/55" />
        <div className="absolute right-[18px] top-[18px] h-3 w-3 rotate-45 bg-amber-500/55" />
        <div className="absolute bottom-[18px] left-[18px] h-3 w-3 rotate-45 bg-amber-500/55" />
        <div className="absolute bottom-[18px] right-[18px] h-3 w-3 rotate-45 bg-amber-500/55" />

        {/* Ornements milieu haut/bas */}
        <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2">
          <div className="h-px w-8 bg-amber-600/30" />
          <div className="h-2 w-2 rotate-45 border border-amber-500/40" />
          <div className="h-px w-8 bg-amber-600/30" />
        </div>
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
          <div className="h-px w-8 bg-amber-600/30" />
          <div className="h-2 w-2 rotate-45 border border-amber-500/40" />
          <div className="h-px w-8 bg-amber-600/30" />
        </div>
      </div>

      {/* Contenu animé */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div style={{ animation: "pulse-zoom 4.5s ease-in-out 0.8s infinite alternate" }}>
          <h1
            className="animate-slide-up font-monoton text-5xl text-amber-500 sm:text-6xl md:text-7xl"
            style={{ animationDelay: "0ms" }}
          >
            Lukyss&apos;Bar
          </h1>
        </div>

        <div
          className="animate-slide-up flex items-center gap-3"
          style={{ animationDelay: "120ms" }}
        >
          <div className="h-px w-16 bg-amber-700/60" />
          <div className="h-1.5 w-1.5 rotate-45 bg-amber-600" />
          <div className="h-px w-16 bg-amber-700/60" />
        </div>

        <div style={{ animation: "pulse-zoom-subtle 6s ease-in-out 1.2s infinite alternate" }}>
          <p
            className="animate-slide-up max-w-md font-playfair text-base italic text-stone-300 sm:text-lg"
            style={{ animationDelay: "240ms" }}
          >
            &ldquo;Les cocktails sont à la soirée ce que les préliminaires sont à
            l&apos;amour.&rdquo;
          </p>
        </div>

        <a
          href="#cocktails"
          className="animate-slide-up mt-4 rounded-full bg-amber-600 px-8 py-2.5 font-playfair text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-500"
          style={{ animationDelay: "360ms" }}
        >
          Découvrir
        </a>
      </div>
    </section>
  );
}
