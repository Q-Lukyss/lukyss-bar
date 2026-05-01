import type { Metadata } from "next";
import "./globals.css";
import { monoton, cinzel, playfair } from "./font";
import { ConvexClientProvider } from "../components/convex-provider";

export const metadata: Metadata = {
  title: {
    template: "%s | Lukyss'Bar",
    default: "Lukyss'Bar",
  },
  description: "Le bar à cocktails de Lukyss — commandez vos cocktails en ligne.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`scroll-smooth ${monoton.variable} ${cinzel.variable} ${playfair.variable}`}
    >
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
