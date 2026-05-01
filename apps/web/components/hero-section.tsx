export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bar-art-deco%201.jpg')" }}
      />
      <div className="absolute inset-0 bg-stone-950/60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/ornamental-frame.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <h1 className="font-monoton text-5xl text-amber-500 sm:text-6xl md:text-7xl">
          Lukyss&apos;Bar
        </h1>

        <div className="flex items-center gap-3">
          <div className="h-px w-16 bg-amber-700/60" />
          <div className="h-1.5 w-1.5 rotate-45 bg-amber-600" />
          <div className="h-px w-16 bg-amber-700/60" />
        </div>

        <p className="max-w-md font-playfair text-base italic text-stone-300 sm:text-lg">
          &ldquo;Les cocktails sont à la soirée ce que les préliminaires sont à
          l&apos;amour.&rdquo;
        </p>

        <a
          href="#cocktails"
          className="mt-4 rounded-full bg-amber-600 px-8 py-2.5 font-playfair text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-500"
        >
          Découvrir
        </a>
      </div>
    </section>
  );
}
