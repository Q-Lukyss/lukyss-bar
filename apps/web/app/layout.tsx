import type { Metadata } from "next";
import "./globals.css";
import { monoton, cinzel, playfair } from "./font";
import { ThemeProvider } from "@/components/theme-provider";

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
      suppressHydrationWarning
      className={`scroll-smooth ${monoton.variable} ${cinzel.variable} ${playfair.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
