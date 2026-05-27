'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Fingerprint } from 'lucide-react';
import { RestaurantSelector } from '@/components/auth/restaurant-selector';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true); // Start true to check existing session
  const [submitting, setSubmitting] = useState(false); // True only while form is submitting
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Controls the flow: false = Login Form, true = Restaurant Selector
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auto-detect existing session: if the user is already logged in with Supabase
  // (e.g., they were redirected here because restaurantId was null),
  // skip the login form and show the restaurant selector directly.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setIsAuthenticated(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-500/20 dark:bg-indigo-500/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-zinc-800/50">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400">
            <Fingerprint className="w-8 h-8" />
          </div>
        </div>

        {loading ? (
          // Initial session check — show spinner to prevent flash of login form
          <div className="flex flex-col items-center justify-center py-8 space-y-3 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Checking session...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8">
              Sign in to Synculariti OS IMS
            </p>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all placeholder:text-zinc-400"
                  placeholder="name@example.com"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all placeholder:text-zinc-400"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center py-3 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-medium rounded-xl transition-all disabled:opacity-50 mt-4 shadow-md"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
              </button>
            </form>

            {message && (
              <div className={`mt-6 p-4 rounded-xl text-sm text-center font-medium border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'}`}>
                {message.text}
              </div>
            )}
          </div>
        ) : (
          <RestaurantSelector />
        )}
      </div>
    </div>
  );
}
