import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panier" };

export default function PanierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
