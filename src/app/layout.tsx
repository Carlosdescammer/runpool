import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://runpool.space"),
  title: {
    default: "Runpool",
    template: "%s • Runpool",
  },
  description: "Run weekly pools with friends. Do the miles, show proof, share the prize.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: "Runpool",
    type: "website",
    url: "https://runpool.space",
    title: "Runpool",
    description: "Run weekly pools with friends. Do the miles, show proof, share the prize.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runpool",
    description: "Run weekly pools with friends. Do the miles, show proof, share the prize.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // enable iOS safe areas
  // Light-only theme color matches --rp-bg (#DAD7CD)
  themeColor: "#DAD7CD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased rp`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster position="top-center" richColors closeButton expand />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
