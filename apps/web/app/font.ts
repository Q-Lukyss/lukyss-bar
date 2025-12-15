import { Monoton, Cinzel_Decorative, Playfair_Display } from "next/font/google";

export const monoton = Monoton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-monoton",
  display: "swap",
});

export const cinzel = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
