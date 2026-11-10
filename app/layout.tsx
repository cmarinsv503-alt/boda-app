import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
});

const lato = Lato({ 
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Boda de Marisol & Nadir",
  description: "Acompáñanos a celebrar nuestro amor",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Fondo perla azulado y texto gris azulado oscuro */}
      <body className={`${playfair.variable} ${lato.variable} font-sans bg-[#f4f6f9] text-slate-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}