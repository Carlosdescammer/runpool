// app/layout.tsx
import Header from '@/components/Header';
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
      <body className={inter.className}>
        <Toaster />
        <Header />
        <main className="container" style={{
          paddingTop: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          minHeight: 'calc(100vh - 80px)',
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
