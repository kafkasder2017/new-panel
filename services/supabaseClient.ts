

import { createClient } from '@supabase/supabase-js';
import { Profil as ProfilData, Kullanici as KullaniciData } from '../types';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const userToProfile = (user: KullaniciData): ProfilData => {
    return {
        id: user.id,
        adSoyad: user.kullanici_adi,
        email: user.email,
        rol: user.rol,
        telefon: '', // This should be fetched from a 'profiles' table if it exists
        profilFotoUrl: `https://i.pravatar.cc/100?u=${user.email}` // Placeholder
    };
};