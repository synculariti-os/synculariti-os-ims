'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PERMISSION_CODES } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { ToggleLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useHasHydrated } from '@/hooks/use-has-hydrated';

interface FeatureFlagRow {
  id: string;
  flagKey: string;
  flagValue: boolean;
}

const FLAG_DEFINITIONS = [
  { key: 'MULTI_LANGUAGE', label: 'Multi Language', description: 'Enable English ↔ Slovak translation UI' },
];

export function FeatureFlagsTable() {
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const isHydrated = useHasHydrated();
  const hasPermRaw = useAuthStore((s) => s.hasPermission);
  const hasPerm = (code: any) => isHydrated && hasPermRaw(code);

  const loadFlags = useCallback(async () => {
    try {
      const res = await apiClient<{ data: FeatureFlagRow[] }>('/settings/feature-flags');
      setFlags(res.data || []);
    } catch (err) {
      console.error('Failed to load feature flags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const handleToggle = async (flagKey: string, currentValue: boolean) => {
    setToggling(flagKey);
    try {
      const res = await apiClient<{ data: FeatureFlagRow }>(`/settings/feature-flags/${flagKey}`, {
        method: 'PUT',
        body: { flagValue: !currentValue },
      });
      setFlags((prev) => {
        const exists = prev.find((f) => f.flagKey === flagKey);
        if (exists) {
          return prev.map((f) => (f.flagKey === flagKey ? res.data : f));
        }
        return [...prev, res.data];
      });
    } catch (err) {
      console.error('Failed to toggle feature flag:', err);
    } finally {
      setToggling(null);
    }
  };

  const getValue = (key: string) => flags.find((f) => f.flagKey === key)?.flagValue ?? false;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enable or disable features for this restaurant. Changes take effect immediately.
        </p>
      </div>
      <div className="p-4">
        <div className="grid gap-2">
          {FLAG_DEFINITIONS.map((def) => {
            const value = getValue(def.key);
            const isToggling = toggling === def.key;
            return (
              <div
                key={def.key}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium text-zinc-900 dark:text-white">{def.key}</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">— {def.label}</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{def.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(def.key, value)}
                  disabled={!hasPerm(PERMISSION_CODES.ADMIN_FEATURE_FLAGS) || isToggling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    value ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'
                  } ${isToggling ? 'opacity-50' : ''}`}
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 text-white mx-auto animate-spin" />
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
