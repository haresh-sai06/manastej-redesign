import type { Metadata, Viewport } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000",
  ),
  title: "Manastej | AI-Powered Mental Wellness & Therapy Platform",
  description:
    "Manastej is a next-generation mental wellness ecosystem combining AI technology, clinical therapy tools, and workplace wellbeing tracking.",
  openGraph: {
    title: "Manastej | Where Science Meets the Soul",
    description: "A privacy-first mental health ecosystem for individuals, therapists, and HR teams.",
    type: "website",
    images: ["/manastej-logo.png"],
  },
};

export const viewport: Viewport = { themeColor: "#051311" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${instrument.variable}`}>
      <head>
        {/* Hide hero intro elements only when JS + motion are available (avoids invisible content without JS). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-motion');setTimeout(function(){document.documentElement.classList.remove('js-motion')},4000)}",
          }}
        />
      </head>
      <body className="grain">{children}</body>
    </html>
  );
}
