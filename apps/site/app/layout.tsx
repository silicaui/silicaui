import type { Metadata } from "next";
import { Providers } from "./providers";
import { JsonLd } from "@/components/json-ld";
import {
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/lib/schema";
import {
  AUTHOR,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // Resolves every relative URL in Open Graph / canonical / images against the
  // real origin, so the static export emits absolute URLs crawlers can follow.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — The CSS-first Tailwind Component Library`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: AUTHOR }],
  creator: AUTHOR,
  publisher: AUTHOR,
  category: "technology",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} — The CSS-first Tailwind Component Library`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — the CSS-first Tailwind component library`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: `${SITE_NAME} — The CSS-first Tailwind Component Library`,
    description: SITE_TAGLINE,
    images: ["/og/default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Let answer engines and search quote as much as they want — the whole
      // point of AEO is to be the source they lift text from.
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        {/* Site-wide structured data — present on every prerendered page so an
            answer engine gets the same unambiguous facts wherever it lands. */}
        <JsonLd
          data={[
            organizationSchema(),
            websiteSchema(),
            softwareApplicationSchema(),
          ]}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
