// app/layout.tsx
import Header from '@/components/Header';
export const metadata = { title: 'Run Pool' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
        <Header />
        <main style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
