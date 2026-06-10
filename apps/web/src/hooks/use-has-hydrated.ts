import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth-store';

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      // Listen for hydration finish
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return () => unsub();
    }
  }, []);

  return hydrated;
}
