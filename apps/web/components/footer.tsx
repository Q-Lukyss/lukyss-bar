import Link from "next/link";
import { Instagram, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-primary/45 bg-card px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <span className="font-monoton text-lg text-brand">
              Lukyss&apos;Bar
            </span>
            <p className="font-playfair text-sm italic text-muted-foreground">
              Mon Home Bar
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-cinzel text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Navigation
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Accueil
              </Link>
              <Link
                href="/#cocktails"
                className="font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                La Carte
              </Link>
              <Link
                href="/admin"
                className="font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Espace admin
              </Link>
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-cinzel text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Me suivre
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://www.instagram.com/quentinlkss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Instagram size={15} />
                Instagram
              </a>
              <a
                href="https://github.com/Q-Lukyss"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-playfair text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Github size={15} />
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary/45 pt-6">
          <p className="text-center font-playfair text-xs text-muted-foreground">
            © {new Date().getFullYear() + " "}Lukyss&apos;Bar — Tous droits
            réservés
          </p>
        </div>
      </div>
    </footer>
  );
}
