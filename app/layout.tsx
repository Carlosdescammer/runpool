// app/layout.tsx
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = { title: 'Run Pool' };

// Ensure iOS safe areas and proper scaling for the app/ tree
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
