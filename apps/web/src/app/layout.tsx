import type { Metadata } from "next"
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-playfair",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
})

export const metadata: Metadata = {
  title: "GanancIA — Inteligencia financiera para tu restaurante",
  description:
    "Analizá la rentabilidad de tu restaurante con inteligencia artificial. Controlá costos, optimizá tu menú y tomá mejores decisiones.",
  metadataBase: new URL("https://ganancia.app"),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} font-sans antialiased bg-white text-carbon`}
      >
        {children}
      </body>
    </html>
  )
}
