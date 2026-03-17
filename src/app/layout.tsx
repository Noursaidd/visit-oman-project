import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visit Oman | Discover & Plan Your Journey",
  description: "Discover Oman's diverse attractions from majestic mountains to pristine beaches. Plan your perfect trip with our intelligent itinerary generator. Supporting Oman Vision 2040.",
  keywords: [
    "Oman",
    "Oman tourism",
    "Oman travel",
    "Muscat",
    "Dhofar",
    "Khareef",
    "Arabian Peninsula",
    "Middle East travel",
    "tourism platform",
    "trip planner",
    "itinerary generator",
    "Oman Vision 2040",
  ],
  authors: [{ name: "Visit Oman" }],
  openGraph: {
    title: "Visit Oman | Discover & Plan Your Journey",
    description: "Discover Oman's diverse attractions and plan your perfect trip with our intelligent itinerary generator.",
    url: "https://visitoman.com",
    siteName: "Visit Oman",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visit Oman | Discover & Plan Your Journey",
    description: "Discover Oman's diverse attractions and plan your perfect trip with our intelligent itinerary generator.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
