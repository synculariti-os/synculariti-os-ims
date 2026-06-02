'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/use-auth-store';
import { Loader2 } from 'lucide-react';
import { RestaurantSelector } from '@/components/auth/restaurant-selector';

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
  if (isAuthenticated && !isPublicRoute && !restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] p-6 relative overflow-hidden">
        {/* Background decoration matching login page */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-500/20 dark:bg-indigo-500/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />
        
        <div className="relative z-10 max-w-md w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-zinc-800/50">
          <RestaurantSelector />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
