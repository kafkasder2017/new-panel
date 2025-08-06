# KAFKASDER Dernek Yönetim Paneli - Hooks ve Utilities Dokümantasyonu

## 1. Genel Bakış

KAFKASDER projesinde custom hook'lar ve yardımcı fonksiyonlar, kod tekrarını önlemek, state yönetimini kolaylaştırmak ve ortak işlevselliği merkezi bir yerden yönetmek için kullanılmaktadır.

## 2. Custom Hooks

### 2.1 Data Management Hooks

#### useData.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { errorHandler } from '../services/errorHandler';
import { cacheService } from '../services/cacheService';

interface UseDataOptions {
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  cache?: boolean;
  cacheTTL?: number;
  realtime?: boolean;
}

interface UseDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (item: Partial<T>) => Promise<T>;
  update: (id: string, item: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  total: number;
}

function useData<T extends { id: string }>(
  tableName: string,
  options: UseDataOptions = {}
): UseDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  const {
    filters = {},
    orderBy = { column: 'created_at', ascending: false },
    limit,
    cache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    realtime = false
  } = options;
  
  const cacheKey = `${tableName}_${JSON.stringify({ filters, orderBy, limit })}`;
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      if (cache) {
        const cachedData = cacheService.get<{ data: T[]; total: number }>(cacheKey);
        if (cachedData) {
          setData(cachedData.data);
          setTotal(cachedData.total);
          setLoading(false);
          return;
        }
      }
      
      let query = supabase.from(tableName).select('*', { count: 'exact' });
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
      
      // Apply ordering
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
      
      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data: result, error: fetchError, count } = await query;
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      const fetchedData = result || [];
      setData(fetchedData);
      setTotal(count || 0);
      
      // Cache the result
      if (cache) {
        cacheService.set(cacheKey, { data: fetchedData, total: count || 0 }, cacheTTL);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Veri getirilemedi';
      setError(errorMessage);
      errorHandler.handleError(err as Error, `useData-${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, filters, orderBy, limit, cache, cacheKey, cacheTTL]);
  
  const create = useCallback(async (item: Partial<T>): Promise<T> => {
    try {
      const { data: result, error: createError } = await supabase
        .from(tableName)
        .insert(item)
        .select()
        .single();
      
      if (createError) {
        throw new Error(createError.message);
      }
      
      // Update local state
      setData(prev => [result, ...prev]);
      setTotal(prev => prev + 1);
      
      // Clear cache
      if (cache) {
        cacheService.delete(cacheKey);
      }
      
      return result;
    } catch (err) {
      errorHandler.handleError(err as Error, `useData-create-${tableName}`);
      throw err;
    }
  }, [tableName, cache, cacheKey]);
  
  const update = useCallback(async (id: string, item: Partial<T>): Promise<T> => {
    try {
      const { data: result, error: updateError } = await supabase
        .from(tableName)
        .update({ ...item, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Update local state
      setData(prev => prev.map(item => item.id === id ? result : item));
      
      // Clear cache
      if (cache) {
        cacheService.delete(cacheKey);
      }
      
      return result;
    } catch (err) {
      errorHandler.handleError(err as Error, `useData-update-${tableName}`);
      throw err;
    }
  }, [tableName, cache, cacheKey]);
  
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      
      // Update local state
      setData(prev => prev.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
      
      // Clear cache
      if (cache) {
        cacheService.delete(cacheKey);
      }
      
    } catch (err) {
      errorHandler.handleError(err as Error, `useData-delete-${tableName}`);
      throw err;
    }
  }, [tableName, cache, cacheKey]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Setup realtime subscription
  useEffect(() => {
    if (!realtime) return;
    
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          console.log('Realtime change:', payload);
          fetchData(); // Refetch data on any change
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [tableName, realtime, fetchData]);
  
  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    delete: deleteItem,
    total
  };
}

export default useData;
```

#### usePerson.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Person, PersonFilters } from '../types';
import { personService } from '../services/personService';
import { errorHandler } from '../services/errorHandler';

interface UsePersonReturn {
  people: Person[];
  loading: boolean;
  error: string | null;
  searchPeople: (query: string) => Promise<Person[]>;
  getPersonById: (id: string) => Promise<Person | null>;
  createPerson: (person: Partial<Person>) => Promise<Person>;
  updatePerson: (id: string, person: Partial<Person>) => Promise<Person>;
  deletePerson: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  filters: PersonFilters;
  setFilters: (filters: PersonFilters) => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };
}

function usePerson(): UsePersonReturn {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PersonFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  
  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await personService.getAll({
        ...filters,
        page,
        pageSize
      });
      
      setPeople(result.data);
      setTotal(result.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kişiler getirilemedi';
      setError(errorMessage);
      errorHandler.handleError(err as Error, 'usePerson-fetchPeople');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);
  
  const searchPeople = useCallback(async (query: string): Promise<Person[]> => {
    try {
      return await personService.search(query);
    } catch (err) {
      errorHandler.handleError(err as Error, 'usePerson-searchPeople');
      return [];
    }
  }, []);
  
  const getPersonById = useCallback(async (id: string): Promise<Person | null> => {
    try {
      return await personService.getById(id);
    } catch (err) {
      errorHandler.handleError(err as Error, 'usePerson-getPersonById');
      return null;
    }
  }, []);
  
  const createPerson = useCallback(async (person: Partial<Person>): Promise<Person> => {
    try {
      const newPerson = await personService.create(person);
      setPeople(prev => [newPerson, ...prev]);
      setTotal(prev => prev + 1);
      return newPerson;
    } catch (err) {
      errorHandler.handleError(err as Error, 'usePerson-createPerson');
      throw err;
    }
  }, []);
  
  const updatePerson = useCallback(async (id: string, person: Partial<Person>): Promise<Person> => {
    try {
      const updatedPerson = await personService.update(id, person);
      setPeople(prev => prev.map(p => p.id === id ? updatedPerson : p));
      return updatedPerson;
    } catch (err) {
      errorHandler.handleError(err as Error, 'usePerson-updatePerson');
      throw err;
    }
  }, []);
  
  const deletePerson = useCallback(async (id: string): Promise<void> => {
    try {
      await personService.delete(id);
      setPeople(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      errorHandler.handleError(err as Error, 'usePerson-deletePerson');
      throw err;
    }
  }, []);
  
  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);
  
  return {
    people,
    loading,
    error,
    searchPeople,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    refetch: fetchPeople,
    filters,
    setFilters,
    pagination: {
      page,
      pageSize,
      total,
      setPage,
      setPageSize
    }
  };
}

export default usePerson;
```

### 2.2 Authentication Hooks

#### useAuth.ts

```typescript
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { KullaniciRol, UserProfile } from '../types';
import { errorHandler } from '../services/errorHandler';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  hasRole: (role: KullaniciRol) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setProfile(data);
    } catch (err) {
      errorHandler.handleError(err as Error, 'useAuth-fetchProfile');
    }
  }, []);
  
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.user) {
        await fetchProfile(data.user.id);
      }
    } catch (err) {
      errorHandler.handleError(err as Error, 'useAuth-signIn');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);
  
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (err) {
      errorHandler.handleError(err as Error, 'useAuth-signOut');
      throw err;
    }
  }, []);
  
  const signUp = useCallback(async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            ...userData
          });
        
        if (profileError) {
          throw new Error(profileError.message);
        }
      }
    } catch (err) {
      errorHandler.handleError(err as Error, 'useAuth-signUp');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      errorHandler.handleError(err as Error, 'useAuth-resetPassword');
      throw err;
    }
  }, []);
  
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setProfile(data);
    } catch (err) {
      errorHandler.handleError(err as Error, 'useAuth-updateProfile');
      throw err;
    }
  }, [user]);
  
  const hasRole = useCallback((role: KullaniciRol): boolean => {
    if (!profile) return false;
    
    const roleHierarchy: Record<KullaniciRol, number> = {
      'SUPER_ADMIN': 4,
      'ADMIN': 3,
      'MODERATOR': 2,
      'USER': 1
    };
    
    return roleHierarchy[profile.role] >= roleHierarchy[role];
  }, [profile]);
  
  const hasPermission = useCallback((permission: string): boolean => {
    if (!profile) return false;
    
    // Super admin has all permissions
    if (profile.role === 'SUPER_ADMIN') return true;
    
    // Check specific permissions based on role
    const rolePermissions: Record<KullaniciRol, string[]> = {
      'SUPER_ADMIN': ['*'],
      'ADMIN': [
        'users.read', 'users.write', 'users.delete',
        'people.read', 'people.write', 'people.delete',
        'donations.read', 'donations.write', 'donations.delete',
        'aid.read', 'aid.write', 'aid.delete',
        'reports.read', 'reports.write',
        'settings.read', 'settings.write'
      ],
      'MODERATOR': [
        'people.read', 'people.write',
        'donations.read', 'donations.write',
        'aid.read', 'aid.write',
        'reports.read'
      ],
      'USER': [
        'people.read',
        'donations.read',
        'aid.read'
      ]
    };
    
    const userPermissions = rolePermissions[profile.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [profile]);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, [fetchProfile]);
  
  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    hasRole,
    hasPermission
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 2.3 UI Hooks

#### useModal.ts

```typescript
import { useState, useCallback } from 'react';

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

function useModal(initialState: boolean = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  return {
    isOpen,
    open,
    close,
    toggle
  };
}

export default useModal;
```

#### useLocalStorage.ts

```typescript
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);
  
  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
```

#### useDebounce.ts

```typescript
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

export default useDebounce;
```

### 2.4 PWA Hooks

#### usePWA.ts

```typescript
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  install: () => Promise<void>;
  showInstallPrompt: boolean;
  dismissInstallPrompt: () => void;
}

function usePWA(): UsePWAReturn {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  const install = useCallback(async () => {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available');
    }
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
      throw error;
    }
  }, [deferredPrompt]);
  
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);
  
  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setIsInstallable(true);
      
      // Show install prompt if not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };
    
    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    isInstallable,
    isInstalled,
    isOnline,
    install,
    showInstallPrompt,
    dismissInstallPrompt
  };
}

export default usePWA;
```

## 3. Utility Functions

### 3.1 Format Utilities

#### format.ts

```typescript
/**
 * Tarih formatlama fonksiyonları
 */
export const formatDate = {
  // Türkçe tarih formatı (DD.MM.YYYY)
  toTurkish: (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR');
  },
  
  // Türkçe tarih ve saat formatı (DD.MM.YYYY HH:mm)
  toTurkishWithTime: (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Relatif tarih ("2 gün önce", "1 saat önce")
  toRelative: (date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Az önce';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} dakika önce`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} saat önce`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} gün önce`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ay önce`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} yıl önce`;
    }
  },
  
  // ISO string'den input date formatına (YYYY-MM-DD)
  toInputDate: (date: string | Date): string => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  
  // Yaş hesaplama
  calculateAge: (birthDate: string | Date): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
};

/**
 * Para birimi formatlama fonksiyonları
 */
export const formatCurrency = {
  // Türk Lirası formatı (1.234,56 TL)
  toTurkishLira: (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },
  
  // Sadece sayı formatı (1.234,56)
  toNumber: (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },
  
  // Kısa format (1,2K, 1,5M)
  toShort: (amount: number): string => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    } else {
      return amount.toString();
    }
  }
};

/**
 * Telefon numarası formatlama fonksiyonları
 */
export const formatPhone = {
  // Türkiye telefon formatı (0555 123 45 67)
  toTurkish: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    } else if (cleaned.length === 10) {
      return '0' + cleaned.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    
    return phone;
  },
  
  // Uluslararası format (+90 555 123 45 67)
  toInternational: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      const withoutZero = cleaned.substring(1);
      return '+90 ' + withoutZero.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    } else if (cleaned.length === 10) {
      return '+90 ' + cleaned.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    
    return phone;
  },
  
  // Sadece rakamlar
  toDigitsOnly: (phone: string): string => {
    return phone.replace(/\D/g, '');
  }
};

/**
 * Kimlik numarası formatlama
 */
export const formatIdentity = {
  // TC Kimlik No maskeleme (123****567)
  mask: (identityNumber: string): string => {
    if (identityNumber.length === 11) {
      return identityNumber.substring(0, 3) + '****' + identityNumber.substring(7);
    }
    return identityNumber;
  },
  
  // TC Kimlik No formatı (123 456 789 01)
  format: (identityNumber: string): string => {
    const cleaned = identityNumber.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1 $2 $3 $4');
    }
    return identityNumber;
  }
};

/**
 * Metin formatlama fonksiyonları
 */
export const formatText = {
  // İlk harfi büyük yap
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
  
  // Her kelimenin ilk harfini büyük yap
  titleCase: (text: string): string => {
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },
  
  // Türkçe karakterleri İngilizce'ye çevir
  toEnglish: (text: string): string => {
    const turkishChars = 'çğıöşüÇĞIİÖŞÜ';
    const englishChars = 'cgiosuCGIIOSU';
    
    let result = text;
    for (let i = 0; i < turkishChars.length; i++) {
      result = result.replace(new RegExp(turkishChars[i], 'g'), englishChars[i]);
    }
    
    return result;
  },
  
  // Metni kısalt
  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  },
  
  // URL slug oluştur
  toSlug: (text: string): string => {
    return formatText.toEnglish(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};
```

### 3.2 Validation Utilities

#### validation.ts

```typescript
/**
 * Validasyon kuralları ve fonksiyonları
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  email?: boolean;
  phone?: boolean;
  tcKimlikNo?: boolean;
  url?: boolean;
  date?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Tek bir alanı validate et
 */
export function validateField(value: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];
  
  for (const rule of rules) {
    // Required check
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push('Bu alan zorunludur');
      continue;
    }
    
    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      continue;
    }
    
    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`En az ${rule.minLength} karakter olmalıdır`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`En fazla ${rule.maxLength} karakter olmalıdır`);
      }
    }
    
    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`En az ${rule.min} olmalıdır`);
      }
      
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`En fazla ${rule.max} olmalıdır`);
      }
    }
    
    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push('Geçersiz format');
    }
    
    // Email validation
    if (rule.email && !validateEmail(value)) {
      errors.push('Geçersiz email adresi');
    }
    
    // Phone validation
    if (rule.phone && !validatePhone(value)) {
      errors.push('Geçersiz telefon numarası');
    }
    
    // TC Kimlik No validation
    if (rule.tcKimlikNo && !validateTCKN(value)) {
      errors.push('Geçersiz TC Kimlik Numarası');
    }
    
    // URL validation
    if (rule.url && !validateURL(value)) {
      errors.push('Geçersiz URL');
    }
    
    // Date validation
    if (rule.date && !validateDate(value)) {
      errors.push('Geçersiz tarih');
    }
    
    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result === false) {
        errors.push('Geçersiz değer');
      } else if (typeof result === 'string') {
        errors.push(result);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Form objesini validate et
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ValidationRule[]>
): Record<keyof T, ValidationResult> & { isValid: boolean } {
  const results = {} as Record<keyof T, ValidationResult>;
  let isFormValid = true;
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const fieldResult = validateField(data[field], fieldRules as ValidationRule[]);
    results[field as keyof T] = fieldResult;
    
    if (!fieldResult.isValid) {
      isFormValid = false;
    }
  }
  
  return {
    ...results,
    isValid: isFormValid
  };
}

/**
 * Email validasyonu
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Telefon numarası validasyonu (Türkiye)
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\s/g, '');
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * TC Kimlik Numarası validasyonu
 */
export function validateTCKN(tcKimlikNo: string): boolean {
  // Boş veya 11 haneli değilse geçersiz
  if (!tcKimlikNo || tcKimlikNo.length !== 11) {
    return false;
  }
  
  // Sadece rakam içermeli
  if (!/^[0-9]+$/.test(tcKimlikNo)) {
    return false;
  }
  
  // İlk hane 0 olamaz
  if (tcKimlikNo[0] === '0') {
    return false;
  }
  
  // Tüm haneler aynı olamaz
  if (new Set(tcKimlikNo).size === 1) {
    return false;
  }
  
  const digits = tcKimlikNo.split('').map(Number);
  
  // 10. hane kontrolü
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  const check1 = (sum1 * 7 - sum2) % 10;
  
  if (check1 !== digits[9]) {
    return false;
  }
  
  // 11. hane kontrolü
  const sum3 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const check2 = sum3 % 10;
  
  return check2 === digits[10];
}

/**
 * URL validasyonu
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tarih validasyonu
 */
export function validateDate(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Yaş validasyonu
 */
export function validateAge(birthDate: string, minAge: number = 0, maxAge: number = 150): boolean {
  if (!validateDate(birthDate)) {
    return false;
  }
  
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  
  return age >= minAge && age <= maxAge;
}

/**
 * Şifre güçlülük validasyonu
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Minimum uzunluk
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('En az 8 karakter olmalıdır');
  }
  
  // Büyük harf
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('En az bir büyük harf içermelidir');
  }
  
  // Küçük harf
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('En az bir küçük harf içermelidir');
  }
  
  // Rakam
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('En az bir rakam içermelidir');
  }
  
  // Özel karakter
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('En az bir özel karakter içermelidir');
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback
  };
}
```

### 3.3 Helper Utilities

#### helpers.ts

```typescript
/**
 * Genel yardımcı fonksiyonlar
 */

/**
 * Dizi işlemleri
 */
export const arrayUtils = {
  // Dizi elemanlarını gruplama
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
  
  // Dizi elemanlarını benzersiz yapma
  unique: <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
  },
  
  // Nesne dizisini benzersiz yapma
  uniqueBy: <T, K extends keyof T>(array: T[], key: K): T[] => {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  },
  
  // Dizi karıştırma
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  
  // Sayfalama
  paginate: <T>(array: T[], page: number, pageSize: number): T[] => {
    const startIndex = (page - 1) * pageSize;
    return array.slice(startIndex, startIndex + pageSize);
  }
};

/**
 * Nesne işlemleri
 */
export const objectUtils = {
  // Derin kopyalama
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },
  
  // Nesne birleştirme (derin)
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = objectUtils.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
    
    return result;
  },
  
  // Boş değerleri temizleme
  removeEmpty: <T extends Record<string, any>>(obj: T): Partial<T> => {
    const result: Partial<T> = {};
    
    for (const key in obj) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        result[key] = value;
      }
    }
    
    return result;
  },
  
  // Nested değer alma
  get: (obj: any, path: string, defaultValue?: any): any => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  },
  
  // Nested değer ayarlama
  set: (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
};

/**
 * String işlemleri
 */
export const stringUtils = {
  // Rastgele string oluşturma
  random: (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Template string işleme
  template: (template: string, variables: Record<string, any>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  },
  
  // Kelime sayısı
  wordCount: (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  },
  
  // Okuma süresi tahmini (dakika)
  readingTime: (text: string, wordsPerMinute: number = 200): number => {
    const words = stringUtils.wordCount(text);
    return Math.ceil(words / wordsPerMinute);
  }
};

/**
 * Dosya işlemleri
 */
export const fileUtils = {
  // Dosya boyutunu okunabilir formata çevirme
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Dosya uzantısı alma
  getExtension: (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },
  
  // MIME type'dan dosya türü belirleme
  getFileType: (mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return 'document';
    }
    return 'other';
  },
  
  // Dosyayı base64'e çevirme
  toBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
};

/**
 * URL işlemleri
 */
export const urlUtils = {
  // Query parametrelerini parse etme
  parseQuery: (search: string): Record<string, string> => {
    const params = new URLSearchParams(search);
    const result: Record<string, string> = {};
    
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    
    return result;
  },
  
  // Query parametrelerini string'e çevirme
  stringifyQuery: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    
    return searchParams.toString();
  },
  
  // URL'den domain alma
  getDomain: (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
};

/**
 * Performans yardımcıları
 */
export const performanceUtils = {
  // Debounce fonksiyonu
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  // Throttle fonksiyonu
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Fonksiyon çalışma süresini ölçme
  measureTime: async <T>(func: () => Promise<T> | T, label?: string): Promise<T> => {
    const start = performance.now();
    const result = await func();
    const end = performance.now();
    
    if (label) {
      console.log(`${label} took ${(end - start).toFixed(2)} milliseconds`);
    }
    
    return result;
  }
};

/**
 * Matematik yardımcıları
 */
export const mathUtils = {
  // Sayıyı belirli aralığa sıkıştırma
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },
  
  // Yüzde hesaplama
  percentage: (value: number, total: number): number => {
    return total === 0 ? 0 : (value / total) * 100;
  },
  
  // Ortalama hesaplama
  average: (numbers: number[]): number => {
    return numbers.length === 0 ? 0 : numbers.reduce((a, b) => a + b, 0) / numbers.length;
  },
  
  // Medyan hesaplama
  median: (numbers: number[]): number => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  },
  
  // Rastgele sayı üretme
  random: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // Sayıyı yuvarla
  round: (value: number, decimals: number = 2): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
};

/**
 * Renk yardımcıları
 */
export const colorUtils = {
  // Hex'i RGB'ye çevirme
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  
  // RGB'yi Hex'e çevirme
  rgbToHex: (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },
  
  // Renk parlaklığını hesaplama
  getBrightness: (hex: string): number => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return 0;
    
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  },
  
  // Rengin açık mı koyu mu olduğunu belirleme
  isLight: (hex: string): boolean => {
    return colorUtils.getBrightness(hex) > 128;
  }
};

## 4. Constants ve Enums

### 4.1 constants.ts

```typescript
/**
 * Uygulama sabitleri
 */

// API Endpoints
export const API_ENDPOINTS = {
  PEOPLE: '/people',
  DONATIONS: '/donations',
  AID_APPLICATIONS: '/aid-applications',
  USERS: '/users',
  REPORTS: '/reports',
  SETTINGS: '/settings'
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
} as const;

// Cache
export const CACHE = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  LONG_TTL: 60 * 60 * 1000, // 1 hour
  SHORT_TTL: 60 * 1000 // 1 minute
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 1000,
  PHONE_REGEX: /^(\+90|0)?[5][0-9]{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const;

// UI
export const UI = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280
} as const;

// Colors
export const COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6'
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD.MM.YYYY',
  DISPLAY_WITH_TIME: 'DD.MM.YYYY HH:mm',
  INPUT: 'YYYY-MM-DD',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ'
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'kafkasder_user_preferences',
  THEME: 'kafkasder_theme',
  LANGUAGE: 'kafkasder_language',
  SIDEBAR_STATE: 'kafkasder_sidebar_state',
  FILTERS: 'kafkasder_filters'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'İnternet bağlantınızı kontrol edin',
  UNAUTHORIZED: 'Bu işlem için yetkiniz bulunmamaktadır',
  NOT_FOUND: 'Aradığınız kayıt bulunamadı',
  VALIDATION_ERROR: 'Girdiğiniz bilgileri kontrol edin',
  SERVER_ERROR: 'Sunucu hatası oluştu',
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Kayıt başarıyla oluşturuldu',
  UPDATED: 'Kayıt başarıyla güncellendi',
  DELETED: 'Kayıt başarıyla silindi',
  SAVED: 'Değişiklikler kaydedildi',
  SENT: 'Mesaj başarıyla gönderildi'
} as const;
```

### 4.2 enums.ts

```typescript
/**
 * Uygulama enum'ları
 */

// Kullanıcı Rolleri
export enum KullaniciRol {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER'
}

// Kişi Durumları
export enum KisiDurumu {
  AKTIF = 'AKTIF',
  PASIF = 'PASIF',
  BEKLEMEDE = 'BEKLEMEDE',
  SILINDI = 'SILINDI'
}

// Üyelik Türleri
export enum UyelikTuru {
  NORMAL = 'NORMAL',
  YARDIM_ALAN = 'YARDIM_ALAN',
  BAGISCI = 'BAGISCI',
  GONULLU = 'GONULLU',
  YONETICI = 'YONETICI'
}

// Bağış Türleri
export enum BagisTuru {
  NAKIT = 'NAKIT',
  AYNI = 'AYNI',
  KURBAN = 'KURBAN',
  FITRE = 'FITRE',
  ZEKAT = 'ZEKAT',
  SADAKA = 'SADAKA',
  KUMBARA = 'KUMBARA'
}

// Ödeme Yöntemleri
export enum OdemeYontemi {
  NAKIT = 'NAKIT',
  BANKA_HAVALESI = 'BANKA_HAVALESI',
  KREDI_KARTI = 'KREDI_KARTI',
  MOBIL_ODEME = 'MOBIL_ODEME',
  KRIPTO = 'KRIPTO'
}

// Yardım Türleri
export enum YardimTuru {
  GIDA = 'GIDA',
  GIYIM = 'GIYIM',
  BARINMA = 'BARINMA',
  SAGLIK = 'SAGLIK',
  EGITIM = 'EGITIM',
  YAKACAK = 'YAKACAK',
  NAKIT = 'NAKIT',
  HUKUKI = 'HUKUKI'
}

// Başvuru Durumları
export enum BasvuruStatus {
  BEKLEMEDE = 'BEKLEMEDE',
  INCELENIYOR = 'INCELENIYOR',
  ONAYLANDI = 'ONAYLANDI',
  REDDEDILDI = 'REDDEDILDI',
  TAMAMLANDI = 'TAMAMLANDI',
  IPTAL = 'IPTAL'
}

// Öncelik Seviyeleri
export enum OncelikSeviyesi {
  DUSUK = 'DUSUK',
  NORMAL = 'NORMAL',
  YUKSEK = 'YUKSEK',
  ACIL = 'ACIL'
}

// Belge Türleri
export enum BelgeTuru {
  KIMLIK = 'KIMLIK',
  IKAMETGAH = 'IKAMETGAH',
  GELIR_BELGESI = 'GELIR_BELGESI',
  SAGLIK_RAPORU = 'SAGLIK_RAPORU',
  OKUL_BELGESI = 'OKUL_BELGESI',
  DIGER = 'DIGER'
}

// Mesaj Türleri
export enum MesajTuru {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  BILDIRIM = 'BILDIRIM'
}

// Rapor Türleri
export enum RaporTuru {
  KISI_LISTESI = 'KISI_LISTESI',
  BAGIS_RAPORU = 'BAGIS_RAPORU',
  YARDIM_RAPORU = 'YARDIM_RAPORU',
  FINANSAL_RAPOR = 'FINANSAL_RAPOR',
  AKTIVITE_RAPORU = 'AKTIVITE_RAPORU'
}

// Tema Türleri
export enum TemaTuru {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO'
}

// Dil Seçenekleri
export enum DilSecenekleri {
  TR = 'TR',
  EN = 'EN',
  AR = 'AR'
}
```

Bu dokümantasyon, KAFKASDER projesindeki tüm custom hook'ların ve yardımcı fonksiyonların detaylı açıklamalarını içermektedir ve geliştiriciler için kapsamlı bir referans kaynağı oluşturmaktadır.
```

