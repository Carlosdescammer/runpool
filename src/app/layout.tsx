import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
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
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-center" richColors closeButton expand />
        </ThemeProvider>
      </body>
    </html>
  );
}
