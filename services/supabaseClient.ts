

import { createClient } from '@supabase/supabase-js';
import { Profil as ProfilData, Kullanici as KullaniciData } from '../types';
import { getEnvConfig } from '../utils/envValidation';

// Get validated environment configuration
let envConfig: ReturnType<typeof getEnvConfig>;
try {
  envConfig = getEnvConfig();
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  throw new Error('Supabase configuration is invalid. Please check your environment variables.');
}

export const supabase = createClient(envConfig.supabaseUrl, envConfig.supabaseAnonKey);

export const userToProfile = (user: KullaniciData): ProfilData => {
    return {
        id: user.id,
        adSoyad: user.kullaniciAdi,
        email: user.email,
        rol: user.rol,
        telefon: '', // This should be fetched from a 'profiles' table if it exists
        profilFotoUrl: `https://i.pravatar.cc/100?u=${user.email}` // Placeholder
    };
};