// app/layout.tsx
import Header from '@/components/Header';
import './globals.css';
export const metadata = { title: 'Run Pool' };

// Ensure iOS safe areas and proper scaling for the app/ tree
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#DAD7CD',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
        <Header />
        <main style={{
          maxWidth: 960,
          margin: '24px auto',
          padding: '0 calc(16px + env(safe-area-inset-right)) 0 calc(16px + env(safe-area-inset-left))',
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
