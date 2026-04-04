'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  type ConsentPreferences,
  DEFAULT_PREFERENCES,
  getConsentFromCookie,
  setConsentCookie,
} from '@/lib/consent';
import { updateGtagConsent, pushConsentEvent } from '@/lib/datalayer';

interface ConsentContextValue {
  preferences: ConsentPreferences | null;
  hasConsented: boolean;
  ready: boolean;
  acceptAll: () => void;
  saveCustom: (
    prefs: Partial<Omit<ConsentPreferences, 'essential' | 'timestamp'>>,
  ) => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  preferences: null,
  hasConsented: false,
  ready: false,
  acceptAll: () => {},
  saveCustom: () => {},
});

// Track consent in a module-level store so we can use useSyncExternalStore
let currentPrefs: ConsentPreferences | null = null;
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): ConsentPreferences | null {
  return currentPrefs;
}

function getServerSnapshot(): ConsentPreferences | null {
  return null;
}

function setPrefsStore(prefs: ConsentPreferences) {
  currentPrefs = prefs;
  listeners.forEach((l) => l());
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const initialized = useRef(false);

  // On mount: read saved cookie and push consent to GTM
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = getConsentFromCookie();
    if (saved) {
      setPrefsStore(saved);
      updateGtagConsent(saved);
    }
  }, []);

  // ready = true after first client render (hydration-safe)
  const ready = useSyncExternalStore(
    (cb) => { cb(); return () => {}; },
    () => true,
    () => false,
  );

  const persist = useCallback(
    (
      prefs: ConsentPreferences,
      action: 'accept_all' | 'reject_all' | 'save_custom',
    ) => {
      setPrefsStore(prefs);
      setConsentCookie(prefs);
      updateGtagConsent(prefs);
      pushConsentEvent(action, 'banner', prefs);
    },
    [],
  );

  const acceptAll = useCallback(() => {
    persist(
      {
        essential: true,
        analytics: true,
        marketing: true,
        adStorage: true,
        adUserData: true,
        adPersonalization: true,
        timestamp: Date.now(),
      },
      'accept_all',
    );
  }, [persist]);

  const saveCustom = useCallback(
    (partial: Partial<Omit<ConsentPreferences, 'essential' | 'timestamp'>>) => {
      const current = preferences ?? DEFAULT_PREFERENCES;
      persist(
        {
          ...current,
          ...partial,
          essential: true,
          timestamp: Date.now(),
        },
        'save_custom',
      );
    },
    [preferences, persist],
  );

  return (
    <ConsentContext.Provider
      value={{
        preferences,
        hasConsented: preferences !== null,
        ready,
        acceptAll,
        saveCustom,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  return useContext(ConsentContext);
}
