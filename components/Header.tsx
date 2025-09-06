// components/Header.tsx
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const isSignedIn = !!userId;
  const showSignIn = !isSignedIn && pathname !== '/signin';

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/signin');
    setMobileMenuOpen(false);
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Only show marketing CTAs on the home page
  const showMarketingCtas = pathname === '/';

  return (
    <>
      <header className="nav">
        <div className="container nav-wrap">
          <Link href="/" className="brand">
            <span className="logo" aria-hidden="true"></span>
            <span>RunPool</span>
          </Link>

          {/* Mobile menu toggle - hidden */}

          <nav className="nav-links desktop-only">
            {isSignedIn ? (
              <>
                <Link href="/settings" className="btn btn-secondary">Settings</Link>
                <button onClick={signOut} className="btn btn-primary">Sign Out</button>
              </>
            ) : (
              showSignIn && <Link href="/signin" className="btn btn-primary">Sign In</Link>
            )}
          </nav>
        </div>

        <nav 
          id="mobile-menu" 
          className="mobile-menu" 
          hidden={!mobileMenuOpen}
        >
          {isSignedIn ? (
            <>
              <Link href="/settings" className="mobile-link" onClick={closeMobileMenu}>Settings</Link>
              <button onClick={signOut} className="mobile-link primary">Sign Out</button>
            </>
          ) : (
            showSignIn && <Link href="/signin" className="mobile-link primary" onClick={closeMobileMenu}>Sign In</Link>
          )}
        </nav>
      </header>
    </>
  );
}
