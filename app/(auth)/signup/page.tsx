'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import FluidBackground from '@/components/FluidBackground';
import './signup.css';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setStatus('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setStatus('Creating your account...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setStatus(error.message);
      } else if (data.session) {
        setStatus('Account created successfully!');
        router.push('/onboarding');
      } else {
        setStatus('Please check your email to confirm your account.');
      }
    } catch (error) {
      setStatus('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-form-side">
        <div className="signup-form-wrapper">
          <div className="signup-logo">
            <span className="logo" aria-hidden="true"></span>
            <span>RunPool</span>
          </div>
          
          <div className="signup-header">
            <p className="signup-tagline">Start your journey</p>
            <h1 className="signup-title">Sign Up to RunPool</h1>
          </div>

          <form className="signup-form" onSubmit={handleSignUp}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className="input-icon">✉️</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="input-icon">🔒</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="signup-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {status && <p className="signup-status">{status}</p>}

          <p className="signup-login-link">
            Have an account? <Link href="/signin">Sign in</Link>
          </p>
        </div>
      </div>
      
      <div className="signup-visual-side">
        <FluidBackground />
      </div>
    </div>
  );
}
