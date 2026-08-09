import type { Metadata } from "next"
import { Inter, Inter_Tight, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Tall Karol — live demos",
  description:
    "Two working demo applications built by Tall Karol: a store analytics suite and a client results portal. Sample data only.",
  // These are portfolio pieces behind a login, not pages meant to rank.
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // The inline script below strips `no-js` before hydration, so the class
      // list legitimately differs between server and client HTML.
      suppressHydrationWarning
      className={`no-js ${interTight.variable} ${plusJakarta.variable} ${inter.variable}`}
    >
      <body className="font-body antialiased">
        {/* Runs before paint: elements staged for anime.js stay hidden only if
            JS is actually going to arrive and animate them in. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('no-js')`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
