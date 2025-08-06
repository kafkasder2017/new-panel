

import { createClient } from '@supabase/supabase-js';
import { Profil as ProfilData, Kullanici as KullaniciData } from '../types';

// Supabase configuration
const supabaseUrl = 'https://hcxstnzdbdeaazyjvroe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeHN0bnpkYmRlYWF6eWp2cm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDcxNTUsImV4cCI6MjA2OTk4MzE1NX0.lDrLQKfoR85wjJAJ_e3SFeyOb-gBn6iNBYJoLk7pOec';

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