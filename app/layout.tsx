// app/layout.tsx
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = { 
  title: 'Run Pool',
  description: 'Social fitness challenges and group running motivation',
  keywords: 'running, fitness, challenges, social, groups',
  authors: [{ name: 'RunPool' }],
  creator: 'RunPool',
  publisher: 'RunPool',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RunPool',
  },
};

// Comprehensive viewport for mobile devices including iPhone
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // For iPhone X+ with notch
  themeColor: '#0d1220',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} rp`}>
        <Toaster />
        {children}
      </body>
    </html>
  );
}
