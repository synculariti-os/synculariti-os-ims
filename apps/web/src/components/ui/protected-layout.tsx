'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/use-auth-store';
import { Loader2 } from 'lucide-react';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const restaurantId = useAuthStore(state => state.restaurantId);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setIsAuthenticated(!!session);
        setIsAuthChecking(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsAuthenticated(!!session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Public routes that don't need auth
  const isPublicRoute = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    router.push('/login');
    return null;
  }

  // Redirect to home if authenticated and trying to access login page
  if (isAuthenticated && isPublicRoute) {
    router.push('/');
    return null;
  }

  // Prompt to select restaurant if authenticated but no context
  if (isAuthenticated && !isPublicRoute && !restaurantId && pathname !== '/') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] p-6 text-center">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No Restaurant Selected</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            You need to select a restaurant context to access this page.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
