import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LaunchPilot — Launch & Distribution Engine for Indie Developers",
  description:
    "You shipped it. Now get it seen. Tailored launches on 50+ platforms, plus Product Hunt, HN, and Reddit launch prep. Built for indie devs.",
  keywords: [
    "indie hacker launch",
    "Product Hunt launch kit",
    "Show HN launch prep",
    "startup directory submission",
    "SaaS distribution",
    "indie dev marketing",
  ],
  authors: [{ name: "LaunchPilot Team" }],
  openGraph: {
    title: "LaunchPilot — Launch & Distribution Engine for Indie Developers",
    description:
      "You shipped it. Now get it seen. Tailored launches on 50+ platforms, plus Product Hunt, HN, and Reddit launch prep.",
    url: "https://launchpilot.dev",
    siteName: "LaunchPilot",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "LaunchPilot - Product Distribution Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchPilot — Launch & Distribution Engine for Indie Developers",
    description:
      "You shipped it. Now get it seen. Tailored launches on 50+ platforms, plus Product Hunt, HN, and Reddit launch prep.",
    creator: "@launchpilot",
    images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#111827",
              border: "1px solid #1f2937",
              color: "#f3f4f6",
            },
          }}
        />
      </body>
    </html>
  );
}
