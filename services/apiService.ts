

import {
    Kullanici, Dava, Person, Proje, YardimBasvurusu, OgrenciBursu, Yetim,
    Odeme, Kumbara, DepoUrunu, FinansalKayit, Gonullu, Etkinlik,
    VefaDestek, GonderilenMesaj, AyniYardimIslemi, Hizmet, HastaneSevk,
    Bagis, Aidat, ApiKey, Webhook, SistemAyarlari, DosyaSistemiOgesi, Dosya,
    Bildirim, AidatDurumu, KullaniciDurum, DenetimKaydi, Yorum, Kurum,
    Profil as ProfilData,
    Kullanici as KullaniciData,
    BildirimDurumu,
    UserSession, FailedLoginAttempt, PersonDocumentNew, PersonNote, AidPayment,
    Membership, MembershipFee, NotificationNew, FileUpload, DonationCampaign
} from '../types';
import { supabase, userToProfile } from './supabaseClient';


// --- Generic Supabase Helper Functions ---
const handleSupabaseError = (error: { message: string }, context: string) => {
    console.error(`Supabase error in ${context}:`, error);
    throw new Error(`Veritabanı hatası (${context}): ${error.message}`);
};

const getAll = async <T extends { id: number | string }>(tableName: string): Promise<T[]> => {
    const { data, error } = await supabase.from(tableName).select('*').order('id', { ascending: false });
    if (error) handleSupabaseError(error, `get all ${tableName}`);
    return data as T[];
};

const getById = async <T extends { id: number | string }>(tableName: string, id: number): Promise<T> => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) handleSupabaseError(error, `get by id ${id} from ${tableName}`);
    return data as T;
};

const createRecord = async <T extends { id: number | string }>(tableName: string, record: any): Promise<T> => {
    // Supabase v2 insert can take a single object, but returns an array in `data`.
    const { data, error } = await supabase.from(tableName).insert([record]).select();
    if (error) handleSupabaseError(error, `create in ${tableName}`);
    if (!data || data.length === 0) throw new Error("Kayıt oluşturulduktan sonra veri alınamadı.");
    return data[0] as T;
};

const updateRecord = async <T extends { id: number | string }>(tableName: string, id: number | string, updates: Partial<T>): Promise<T> => {
    const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select();
    if (error) handleSupabaseError(error, `update id ${id} in ${tableName}`);
     if (!data || data.length === 0) throw new Error("Kayıt güncellendikten sonra veri alınamadı.");
    return data[0] as T;
};

const deleteRecord = async (tableName: string, id: number | string): Promise<void> => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete id ${id} in ${tableName}`);
};


// --- AUTHENTICATION ---
export const login = async (email: string, password: string): Promise<Kullanici> => {
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    if (!user) throw new Error("Giriş başarısız, kullanıcı bulunamadı.");
    
    // Fetch profile and update last sign-in time
    const { data: userProfile, error: profileError } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('email', user.email)
        .single();
        
    if (profileError || !userProfile) {
        // If profile doesn't exist, sign out to prevent inconsistent state
        await supabase.auth.signOut();
        throw profileError || new Error("Kullanıcı profili bulunamadı.");
    }
        
    return userProfile as Kullanici;
};



export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getProfileForUser = async (user: { email?: string }): Promise<ProfilData | null> => {
    if (!user.email) return null;
    const { data, error } = await supabase
        .from('kullanicilar')
        .select('*')
        .eq('email', user.email)
        .single();
    
    if (error) {
        // 'PGRST116' is the code for "No rows found"
        if (error.code === 'PGRST116') return null;
        handleSupabaseError(error, `getProfileForUser`);
        return null;
    }
    return data ? userToProfile(data as KullaniciData) : null;
};

// --- API FUNCTIONS --- //

// Denetim Kayıtları
export const getDenetimKayitlari = (): Promise<DenetimKaydi[]> => getAll<DenetimKaydi>('denetim_kayitlari');
export const createDenetimKaydi = (kayit: Omit<DenetimKaydi, 'id'>): Promise<DenetimKaydi> => createRecord<DenetimKaydi>('denetim_kayitlari', kayit);

// Yorumlar
export const createYorum = (yorum: Omit<Yorum, 'id'>): Promise<Yorum> => createRecord<Yorum>('yorumlar', yorum);

// Kişiler
export const getPeople = (): Promise<Person[]> => getAll<Person>('people');
export const getPersonById = (id: number): Promise<Person> => getById<Person>('people', id);
export const createPerson = (person: Omit<Person, 'id'>): Promise<Person> => createRecord<Person>('people', person);
export const updatePerson = (id: number, person: Partial<Person>): Promise<Person> => updateRecord<Person>('people', id, person);
export const deletePerson = (id: number): Promise<void> => deleteRecord('people', id);
export const deletePeople = async (ids: number[]): Promise<void> => {
    const { error } = await supabase.from('people').delete().in('id', ids);
    if (error) handleSupabaseError(error, 'delete multiple people');
};


// Kullanıcılar
export const getUsers = (): Promise<Kullanici[]> => getAll<Kullanici>('kullanicilar');
export const createUser = async (user: Partial<Kullanici> & { password?: string }): Promise<Kullanici> => {
    if (!user.email || !user.password) throw new Error("Email and password are required");

    // Supabase handles auth user creation in the background via a trigger is better, 
    // but for frontend-only logic, we do it here.
    const { data, error: authError } = await supabase.auth.signUp({ 
        email: user.email, 
        password: user.password 
    });

    if (authError) throw authError;
    if (!data.user) throw new Error("User creation failed in Auth.");
    
    const profileToCreate = {
        kullanici_adi: user.kullanici_adi, 
        email: user.email, 
        rol: user.rol,
        durum: user.durum || KullaniciDurum.AKTIF,
    };
    return createRecord<Kullanici>('kullanicilar', profileToCreate);
};
export const updateUser = (id: number, user: Partial<Kullanici>): Promise<Kullanici> => updateRecord<Kullanici>('kullanicilar', id, user);
export const deleteUser = (id: number): Promise<void> => deleteRecord('kullanicilar', id); // Note: this doesn't delete the auth user.

// Projeler
export const getProjeler = (): Promise<Proje[]> => getAll<Proje>('projects');
export const getProjeById = (id: number): Promise<Proje> => getById<Proje>('projects', id);
export const createProje = (proje: Omit<Proje, 'id'>): Promise<Proje> => createRecord<Proje>('projects', proje);
export const updateProje = (id: number, proje: Partial<Proje>): Promise<Proje> => updateRecord<Proje>('projects', id, proje);
export const deleteProje = (id: number): Promise<void> => deleteRecord('projects', id);

// Bağışlar
export const getBagislar = (): Promise<Bagis[]> => getAll<Bagis>('donations');
export const createBagis = (bagis: Omit<Bagis, 'id'>): Promise<Bagis> => createRecord<Bagis>('donations', bagis);
export const updateBagis = (id: number, bagis: Partial<Bagis>): Promise<Bagis> => updateRecord<Bagis>('donations', id, bagis);
export const deleteBagis = (id: number): Promise<void> => deleteRecord('donations', id);

// Yardım Başvuruları
export const getYardimBasvurulari = (): Promise<YardimBasvurusu[]> => getAll<YardimBasvurusu>('aid_applications');
export const getYardimBasvurusuById = (id: number): Promise<YardimBasvurusu> => getById<YardimBasvurusu>('aid_applications', id);
export const createYardimBasvurusu = (basvuru: Omit<YardimBasvurusu, 'id'>): Promise<YardimBasvurusu> => createRecord<YardimBasvurusu>('aid_applications', basvuru);
export const updateYardimBasvurusu = (id: number, basvuru: Partial<YardimBasvurusu>): Promise<YardimBasvurusu> => updateRecord<YardimBasvurusu>('aid_applications', id, basvuru);
export const deleteYardimBasvurusu = (id: number): Promise<void> => deleteRecord('aid_applications', id);

// Davalar
export const getDavalar = (): Promise<Dava[]> => getAll<Dava>('davalar');
export const getDavaById = (id: number): Promise<Dava> => getById<Dava>('davalar', id);
export const createDava = (dava: Omit<Dava, 'id'>): Promise<Dava> => createRecord<Dava>('davalar', dava);
export const updateDava = (id: number, dava: Partial<Dava>): Promise<Dava> => updateRecord<Dava>('davalar', id, dava);
export const deleteDava = (id: number): Promise<void> => deleteRecord('davalar', id);

// Ödemeler
export const getOdemeler = (): Promise<Odeme[]> => getAll<Odeme>('odemeler');
export const createOdeme = (odeme: Omit<Odeme, 'id'>): Promise<Odeme> => createRecord<Odeme>('odemeler', odeme);
export const updateOdeme = (id: number, odeme: Partial<Odeme>): Promise<Odeme> => updateRecord<Odeme>('odemeler', id, odeme);
export const deleteOdeme = (id: number): Promise<void> => deleteRecord('odemeler', id);

// Finansal Kayıtlar
export const getFinansalKayitlar = (): Promise<FinansalKayit[]> => getAll<FinansalKayit>('finansal_kayitlar');
export const createFinansalKayit = (kayit: Omit<FinansalKayit, 'id'>): Promise<FinansalKayit> => createRecord<FinansalKayit>('finansal_kayitlar', kayit);
export const updateFinansalKayit = (id: number, kayit: Partial<FinansalKayit>): Promise<FinansalKayit> => updateRecord<FinansalKayit>('finansal_kayitlar', id, kayit);
export const deleteFinansalKayit = (id: number): Promise<void> => deleteRecord('finansal_kayitlar', id);

// Gönüllüler
export const getGonulluler = (): Promise<Gonullu[]> => getAll<Gonullu>('gonulluler');
export const getGonulluById = (id: number): Promise<Gonullu> => getById<Gonullu>('gonulluler', id);
export const createGonullu = (gonullu: Omit<Gonullu, 'id'>): Promise<Gonullu> => createRecord<Gonullu>('gonulluler', gonullu);
export const updateGonullu = (id: number, gonullu: Partial<Gonullu>): Promise<Gonullu> => updateRecord<Gonullu>('gonulluler', id, gonullu);

// Vefa Destek
export const getVefaDestekList = (): Promise<VefaDestek[]> => getAll<VefaDestek>('vefa_destek');
export const getVefaDestekById = (id: number): Promise<VefaDestek> => getById<VefaDestek>('vefa_destek', id);
export const createVefaDestek = (vefa: Omit<VefaDestek, 'id'>): Promise<VefaDestek> => createRecord<VefaDestek>('vefa_destek', vefa);
export const updateVefaDestek = (id: number, vefa: Partial<VefaDestek>): Promise<VefaDestek> => updateRecord<VefaDestek>('vefa_destek', id, vefa);
export const deleteVefaDestek = (id: number): Promise<void> => deleteRecord('vefa_destek', id);

// Kumbara
export const getKumbaralar = (): Promise<Kumbara[]> => getAll<Kumbara>('kumbaralar');
export const createKumbara = (kumbara: Omit<Kumbara, 'id'>): Promise<Kumbara> => createRecord<Kumbara>('kumbaralar', kumbara);
export const updateKumbara = (id: number, kumbara: Partial<Kumbara>): Promise<Kumbara> => updateRecord<Kumbara>('kumbaralar', id, kumbara);
export const deleteKumbara = (id: number): Promise<void> => deleteRecord('kumbaralar', id);

// Depo
export const getDepoUrunleri = (): Promise<DepoUrunu[]> => getAll<DepoUrunu>('depo_urunleri');
export const createDepoUrunu = (urun: Omit<DepoUrunu, 'id'>): Promise<DepoUrunu> => createRecord<DepoUrunu>('depo_urunleri', urun);
export const updateDepoUrunu = (id: number, urun: Partial<DepoUrunu>): Promise<DepoUrunu> => updateRecord<DepoUrunu>('depo_urunleri', id, urun);

// Yetimler
export const getYetimler = (): Promise<Yetim[]> => getAll<Yetim>('yetimler');
export const getYetimById = (id: number): Promise<Yetim> => getById<Yetim>('yetimler', id);
export const createYetim = (yetim: Omit<Yetim, 'id'>): Promise<Yetim> => createRecord<Yetim>('yetimler', yetim);
export const updateYetim = (id: number, yetim: Partial<Yetim>): Promise<Yetim> => updateRecord<Yetim>('yetimler', id, yetim);
export const deleteYetim = (id: number): Promise<void> => deleteRecord('yetimler', id);

// Burslar
export const getOgrenciBurslari = (): Promise<OgrenciBursu[]> => getAll<OgrenciBursu>('ogrenci_burslari');
export const getOgrenciBursuById = (id: number): Promise<OgrenciBursu> => getById<OgrenciBursu>('ogrenci_burslari', id);
export const createOgrenciBursu = (burs: Omit<OgrenciBursu, 'id'>): Promise<OgrenciBursu> => createRecord<OgrenciBursu>('ogrenci_burslari', burs);
export const updateOgrenciBursu = (id: number, burs: Partial<OgrenciBursu>): Promise<OgrenciBursu> => updateRecord<OgrenciBursu>('ogrenci_burslari', id, burs);
export const deleteOgrenciBursu = (id: number): Promise<void> => deleteRecord('ogrenci_burslari', id);

// Etkinlikler
export const getEtkinlikler = (): Promise<Etkinlik[]> => getAll<Etkinlik>('etkinlikler');
export const getEtkinlikById = (id: number): Promise<Etkinlik> => getById<Etkinlik>('etkinlikler', id);
export const createEtkinlik = (etkinlik: Omit<Etkinlik, 'id'>): Promise<Etkinlik> => createRecord<Etkinlik>('etkinlikler', etkinlik);
export const updateEtkinlik = (id: number, etkinlik: Partial<Etkinlik>): Promise<Etkinlik> => updateRecord<Etkinlik>('etkinlikler', id, etkinlik);
export const deleteEtkinlik = (id: number): Promise<void> => deleteRecord('etkinlikler', id);

// Toplu İletişim
export const getMessages = (): Promise<GonderilenMesaj[]> => getAll<GonderilenMesaj>('gonderilen_mesajlar');
export const createMessageLog = (log: Omit<GonderilenMesaj, 'id'>): Promise<GonderilenMesaj> => createRecord<GonderilenMesaj>('gonderilen_mesajlar', log);

// Ayni Yardim
export const getAyniYardimIslemleri = (): Promise<AyniYardimIslemi[]> => getAll<AyniYardimIslemi>('ayni_yardim_islemleri');
export const createAyniYardimIslemi = (islem: Omit<AyniYardimIslemi, 'id'>): Promise<AyniYardimIslemi> => createRecord<AyniYardimIslemi>('ayni_yardim_islemleri', islem);

// Hizmetler
export const getHizmetler = (): Promise<Hizmet[]> => getAll<Hizmet>('hizmetler');
export const createHizmet = (hizmet: Omit<Hizmet, 'id'>): Promise<Hizmet> => createRecord<Hizmet>('hizmetler', hizmet);
export const updateHizmet = (id: number, hizmet: Partial<Hizmet>): Promise<Hizmet> => updateRecord<Hizmet>('hizmetler', id, hizmet);
export const deleteHizmet = (id: number): Promise<void> => deleteRecord('hizmetler', id);

// Hastane Sevk
export const getHastaneSevkler = (): Promise<HastaneSevk[]> => getAll<HastaneSevk>('hastane_sevkler');
export const createHastaneSevk = (sevk: Omit<HastaneSevk, 'id'>): Promise<HastaneSevk> => createRecord<HastaneSevk>('hastane_sevkler', sevk);
export const updateHastaneSevk = (id: number, sevk: Partial<HastaneSevk>): Promise<HastaneSevk> => updateRecord<HastaneSevk>('hastane_sevkler', id, sevk);
export const deleteHastaneSevk = (id: number): Promise<void> => deleteRecord('hastane_sevkler', id);

// API Keys & Webhooks
const generateApiKey = () => `KFK_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;

export const getApiKeys = (): Promise<ApiKey[]> => getAll<ApiKey>('api_keys');
export const createApiKey = async (keyData: { name: string }): Promise<{ newKey: ApiKey, fullKey: string }> => {
    const fullKey = generateApiKey();
    // Store only a portion of the key for display purposes
    const storedKey = `${fullKey.slice(0, 7)}...${fullKey.slice(-4)}`;

    const recordToCreate: Omit<ApiKey, 'id'> = {
        name: keyData.name,
        key: storedKey,
        createdDate: new Date().toISOString(),
        status: 'Active',
    };

    const newKey: ApiKey = await createRecord<ApiKey>('api_keys', recordToCreate);

    return { newKey, fullKey };
};
export const updateApiKey = (id: number, key: Partial<ApiKey>): Promise<ApiKey> => updateRecord<ApiKey>('api_keys', id, key);
export const deleteApiKey = (id: number): Promise<void> => deleteRecord('api_keys', id);

export const getWebhooks = (): Promise<Webhook[]> => getAll<Webhook>('webhooks');
export const createWebhook = (webhook: Omit<Webhook, 'id'>): Promise<Webhook> => createRecord<Webhook>('webhooks', webhook);
export const updateWebhook = (id: number, webhook: Partial<Webhook>): Promise<Webhook> => updateRecord<Webhook>('webhooks', id, webhook);
export const deleteWebhook = (id: number): Promise<void> => deleteRecord('webhooks', id);

// Ayarlar
export const getSistemAyarlari = (): Promise<SistemAyarlari> => getById<SistemAyarlari>('ayarlar', 1);
export const updateSistemAyarlari = (settings: Partial<SistemAyarlari>): Promise<SistemAyarlari> => updateRecord<SistemAyarlari>('ayarlar', 1, settings);

// Aidatlar
export const getAidatlarByUyeId = async (uyeId: number): Promise<Aidat[]> => {
    const { data, error } = await supabase.from('aidatlar').select('*').eq('uyeId', uyeId);
    if (error) handleSupabaseError(error, `getAidatlarByUyeId for user ${uyeId}`);
    return data as Aidat[];
};
export const createAidat = (aidat: Omit<Aidat, 'id'>): Promise<Aidat> => createRecord<Aidat>('aidatlar', aidat);
export const updateAidat = (id: number, aidat: Partial<Aidat>): Promise<Aidat> => updateRecord<Aidat>('aidatlar', id, aidat);

// Notifications (Bildirimler)
export const getBildirimler = (): Promise<Bildirim[]> => getAll<Bildirim>('notifications');
export const createBildirim = (bildirim: Omit<Bildirim, 'id'>): Promise<Bildirim> => createRecord<Bildirim>('notifications', bildirim);
export const updateBildirim = (id: string, bildirim: Partial<Bildirim>): Promise<Bildirim> => updateRecord<Bildirim>('notifications', id, bildirim);
export const deleteBildirim = (id: string): Promise<void> => deleteRecord('notifications', id);
export const markAllAsRead = async () => {
    const { data: unread, error: selectError } = await supabase.from('notifications').select('id').eq('is_read', false);
    if(selectError || !unread) {
        if (selectError) handleSupabaseError(selectError, 'markAllAsRead select');
        return;
    };
    const idsToUpdate = unread.map((u: { id: string }) => u.id);
    if(idsToUpdate.length === 0) return;
    const { error } = await (supabase.from('notifications') as any).update({ is_read: true }).in('id', idsToUpdate);
    if(error) handleSupabaseError(error, 'markAllAsRead update');
};


// File Storage
export const listFiles = async (path: string): Promise<DosyaSistemiOgesi[]> => {
    const { data, error } = await supabase.storage.from('dokumanlar').list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) handleSupabaseError(error, `listFiles at ${path}`);
    
    // The data from list() can contain folders which have id: null and no metadata.
    // We cast to `any` to handle this discrepancy with the official types for now.
    const items: DosyaSistemiOgesi[] = ((data as any[]) || []).map(item => {
        if (!item.metadata) { // Folders don't have metadata
            return { id: item.name, name: item.name, type: 'folder', parentId: path || null };
        } else { // It's a file
             let fileType: Dosya['fileType'] = 'other';
             if (item.metadata.mimetype.startsWith('image/')) fileType = 'image';
             else if (item.metadata.mimetype === 'application/pdf') fileType = 'pdf';
             else if (item.metadata.mimetype.includes('word')) fileType = 'word';
             else if (item.metadata.mimetype.includes('excel') || item.metadata.mimetype.includes('spreadsheet')) fileType = 'excel';

            return { 
                id: item.id,
                name: item.name,
                type: 'file',
                fileType,
                size: item.metadata.size,
                uploadDate: item.created_at,
                parentId: path || null,
                path: `${path}/${item.name}`,
                url: getPublicUrl(`${path}/${item.name}`)
            };
        }
    });
    return items;
};

export const createFolder = async (path: string): Promise<void> => {
    // Supabase storage creates folders implicitly when you upload a file with a path.
    // We create a .emptyFolder file to "materialize" the folder.
    const { error } = await supabase.storage.from('dokumanlar').upload(`${path}/.emptyFolder`, new Blob(['']));
    if (error) handleSupabaseError(error, `createFolder at ${path}`);
};

export const uploadFile = async (path: string, file: File): Promise<Dosya> => {
    const filePath = path ? `${path}/${file.name}` : file.name;
    const bucket = supabase.storage.from('dokumanlar');
    const { data, error } = await bucket.upload(filePath, file);
    
    if (error) {
        handleSupabaseError(error, `uploadFile to ${filePath}`);
        throw error;
    }
    
    let fileType: Dosya['fileType'] = 'other';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type === 'application/pdf') fileType = 'pdf';
    else if (file.type.includes('word')) fileType = 'word';
    else if (file.type.includes('excel') || file.type.includes('spreadsheet')) fileType = 'excel';

    const newFile: Dosya = {
        id: data?.path || filePath, name: file.name, type: 'file', fileType, size: file.size,
        uploadDate: new Date().toISOString(), parentId: path || null, url: getPublicUrl(filePath), path: filePath
    };
    return newFile;
};
export const updateFile = async (id: string, updates: Partial<Dosya>): Promise<Dosya> => {
    // This is a placeholder. File metadata should be in a database table to be updatable.
    console.warn("updateFile is a placeholder and doesn't persist changes to Supabase Storage metadata.");
    return { id, ...updates } as Dosya;
};

export const deleteFiles = async (paths: string[]): Promise<void> => {
    const bucket = supabase.storage.from('dokumanlar');
    const { error } = await bucket.remove(paths);
    if (error) handleSupabaseError(error, `deleteFiles`);
};

export const getPublicUrl = (path: string): string => {
    const { data } = supabase.storage.from('dokumanlar').getPublicUrl(path);
    return data.publicUrl;
};

// Kurumlar
export const getKurumlar = (): Promise<Kurum[]> => getAll<Kurum>('kurumlar');
export const getKurumById = (id: number): Promise<Kurum> => getById<Kurum>('kurumlar', id);
export const createKurum = (kurum: Omit<Kurum, 'id'>): Promise<Kurum> => createRecord<Kurum>('kurumlar', kurum);
export const updateKurum = (id: number, kurum: Partial<Kurum>): Promise<Kurum> => updateRecord<Kurum>('kurumlar', id, kurum);
export const deleteKurum = (id: number): Promise<void> => deleteRecord('kurumlar', id);

// === YENİ TABLOLAR İÇİN API FONKSİYONLARI ===

// User Sessions (Kullanıcı Oturumları)
export const getUserSessions = (): Promise<UserSession[]> => getAll<UserSession>('user_sessions');
export const getUserSessionById = async (id: string): Promise<UserSession> => {
    const { data, error } = await supabase.from('user_sessions').select('*').eq('id', id).single();
    if (error) handleSupabaseError(error, `get user session ${id}`);
    return data as UserSession;
};
export const createUserSession = (session: Omit<UserSession, 'id' | 'created_at'>): Promise<UserSession> => {
    const sessionData = { ...session, created_at: new Date().toISOString() };
    return createRecord<UserSession>('user_sessions', sessionData);
};
export const updateUserSession = async (id: string, session: Partial<UserSession>): Promise<UserSession> => {
    const { data, error } = await supabase.from('user_sessions').update(session).eq('id', id).select();
    if (error) handleSupabaseError(error, `update user session ${id}`);
    if (!data || data.length === 0) throw new Error("Oturum güncellendikten sonra veri alınamadı.");
    return data[0] as UserSession;
};
export const deleteUserSession = async (id: string): Promise<void> => {
    const { error } = await supabase.from('user_sessions').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete user session ${id}`);
};

// Failed Login Attempts (Başarısız Giriş Denemeleri)
export const getFailedLoginAttempts = (): Promise<FailedLoginAttempt[]> => getAll<FailedLoginAttempt>('failed_login_attempts');
export const createFailedLoginAttempt = (attempt: Omit<FailedLoginAttempt, 'id' | 'attempt_time'>): Promise<FailedLoginAttempt> => {
    const attemptData = { ...attempt, attempt_time: new Date().toISOString() };
    return createRecord<FailedLoginAttempt>('failed_login_attempts', attemptData);
};
export const getFailedLoginAttemptsByEmail = async (email: string, hours: number = 24): Promise<FailedLoginAttempt[]> => {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .eq('email', email)
        .gte('attempt_time', since)
        .order('attempt_time', { ascending: false });
    if (error) handleSupabaseError(error, `get failed login attempts for ${email}`);
    return data as FailedLoginAttempt[];
};

// Person Documents (Kişi Belgeleri)
export const getPersonDocuments = (): Promise<PersonDocumentNew[]> => getAll<PersonDocumentNew>('person_documents');
export const getPersonDocumentsByPersonId = async (personId: number): Promise<PersonDocumentNew[]> => {
    const { data, error } = await supabase
        .from('person_documents')
        .select('*')
        .eq('person_id', personId)
        .order('uploaded_at', { ascending: false });
    if (error) handleSupabaseError(error, `get documents for person ${personId}`);
    return data as PersonDocumentNew[];
};
export const createPersonDocument = (document: Omit<PersonDocumentNew, 'id' | 'uploaded_at'>): Promise<PersonDocumentNew> => {
    const documentData = { ...document, uploaded_at: new Date().toISOString() };
    return createRecord<PersonDocumentNew>('person_documents', documentData);
};
export const deletePersonDocument = async (id: string): Promise<void> => {
    const { error } = await supabase.from('person_documents').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete person document ${id}`);
};

// Person Notes (Kişi Notları)
export const getPersonNotes = (): Promise<PersonNote[]> => getAll<PersonNote>('person_notes');
export const getPersonNotesByPersonId = async (personId: number): Promise<PersonNote[]> => {
    const { data, error } = await supabase
        .from('person_notes')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: false });
    if (error) handleSupabaseError(error, `get notes for person ${personId}`);
    return data as PersonNote[];
};
export const createPersonNote = (note: Omit<PersonNote, 'id' | 'created_at'>): Promise<PersonNote> => {
    const noteData = { ...note, created_at: new Date().toISOString() };
    return createRecord<PersonNote>('person_notes', noteData);
};
export const updatePersonNote = async (id: string, note: Partial<PersonNote>): Promise<PersonNote> => {
    const { data, error } = await supabase.from('person_notes').update(note).eq('id', id).select();
    if (error) handleSupabaseError(error, `update person note ${id}`);
    if (!data || data.length === 0) throw new Error("Not güncellendikten sonra veri alınamadı.");
    return data[0] as PersonNote;
};
export const deletePersonNote = async (id: string): Promise<void> => {
    const { error } = await supabase.from('person_notes').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete person note ${id}`);
};

// Aid Payments (Yardım Ödemeleri)
export const getAidPayments = (): Promise<AidPayment[]> => getAll<AidPayment>('aid_payments');
export const getAidPaymentsByApplicationId = async (applicationId: number): Promise<AidPayment[]> => {
    const { data, error } = await supabase
        .from('aid_payments')
        .select('*')
        .eq('application_id', applicationId)
        .order('payment_date', { ascending: false });
    if (error) handleSupabaseError(error, `get payments for application ${applicationId}`);
    return data as AidPayment[];
};
export const createAidPayment = (payment: Omit<AidPayment, 'id' | 'created_at'>): Promise<AidPayment> => {
    const paymentData = { ...payment, created_at: new Date().toISOString() };
    return createRecord<AidPayment>('aid_payments', paymentData);
};
export const updateAidPayment = async (id: string, payment: Partial<AidPayment>): Promise<AidPayment> => {
    const { data, error } = await supabase.from('aid_payments').update(payment).eq('id', id).select();
    if (error) handleSupabaseError(error, `update aid payment ${id}`);
    if (!data || data.length === 0) throw new Error("Ödeme güncellendikten sonra veri alınamadı.");
    return data[0] as AidPayment;
};
export const deleteAidPayment = async (id: string): Promise<void> => {
    const { error } = await supabase.from('aid_payments').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete aid payment ${id}`);
};

// Memberships (Üyelikler)
export const getMemberships = (): Promise<Membership[]> => getAll<Membership>('memberships');
export const getMembershipsByPersonId = async (personId: number): Promise<Membership[]> => {
    const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('person_id', personId)
        .order('start_date', { ascending: false });
    if (error) handleSupabaseError(error, `get memberships for person ${personId}`);
    return data as Membership[];
};
export const createMembership = (membership: Omit<Membership, 'id' | 'created_at'>): Promise<Membership> => {
    const membershipData = { ...membership, created_at: new Date().toISOString() };
    return createRecord<Membership>('memberships', membershipData);
};
export const updateMembership = async (id: string, membership: Partial<Membership>): Promise<Membership> => {
    const { data, error } = await supabase.from('memberships').update(membership).eq('id', id).select();
    if (error) handleSupabaseError(error, `update membership ${id}`);
    if (!data || data.length === 0) throw new Error("Üyelik güncellendikten sonra veri alınamadı.");
    return data[0] as Membership;
};
export const deleteMembership = async (id: string): Promise<void> => {
    const { error } = await supabase.from('memberships').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete membership ${id}`);
};

// Membership Fees (Aidat Takibi)
export const getMembershipFees = (): Promise<MembershipFee[]> => getAll<MembershipFee>('membership_fees');
export const getMembershipFeesByMembershipId = async (membershipId: string): Promise<MembershipFee[]> => {
    const { data, error } = await supabase
        .from('membership_fees')
        .select('*')
        .eq('membership_id', membershipId)
        .order('due_date', { ascending: false });
    if (error) handleSupabaseError(error, `get fees for membership ${membershipId}`);
    return data as MembershipFee[];
};
export const createMembershipFee = (fee: Omit<MembershipFee, 'id' | 'created_at'>): Promise<MembershipFee> => {
    const feeData = { ...fee, created_at: new Date().toISOString() };
    return createRecord<MembershipFee>('membership_fees', feeData);
};
export const updateMembershipFee = async (id: string, fee: Partial<MembershipFee>): Promise<MembershipFee> => {
    const { data, error } = await supabase.from('membership_fees').update(fee).eq('id', id).select();
    if (error) handleSupabaseError(error, `update membership fee ${id}`);
    if (!data || data.length === 0) throw new Error("Aidat güncellendikten sonra veri alınamadı.");
    return data[0] as MembershipFee;
};
export const deleteMembershipFee = async (id: string): Promise<void> => {
    const { error } = await supabase.from('membership_fees').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete membership fee ${id}`);
};

// Notifications (Bildirimler - Yeni Sistem)
export const getNotificationsNew = (): Promise<NotificationNew[]> => getAll<NotificationNew>('notifications');
export const getNotificationsByUserId = async (userId: string): Promise<NotificationNew[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) handleSupabaseError(error, `get notifications for user ${userId}`);
    return data as NotificationNew[];
};
export const createNotificationNew = (notification: Omit<NotificationNew, 'id' | 'created_at'>): Promise<NotificationNew> => {
    const notificationData = { ...notification, created_at: new Date().toISOString() };
    return createRecord<NotificationNew>('notifications', notificationData);
};
export const markNotificationAsRead = async (id: string): Promise<NotificationNew> => {
    const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select();
    if (error) handleSupabaseError(error, `mark notification as read ${id}`);
    if (!data || data.length === 0) throw new Error("Bildirim güncellenemedi.");
    return data[0] as NotificationNew;
};
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    if (error) handleSupabaseError(error, `mark all notifications as read for user ${userId}`);
};
export const deleteNotificationNew = async (id: string): Promise<void> => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete notification ${id}`);
};

// File Uploads (Dosya Yüklemeleri)
export const getFileUploads = (): Promise<FileUpload[]> => getAll<FileUpload>('file_uploads');
export const getFileUploadsByEntity = async (entityType: string, entityId: string): Promise<FileUpload[]> => {
    const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
    if (error) handleSupabaseError(error, `get file uploads for ${entityType} ${entityId}`);
    return data as FileUpload[];
};
export const createFileUpload = (fileUpload: Omit<FileUpload, 'id' | 'created_at'>): Promise<FileUpload> => {
    const fileData = { ...fileUpload, created_at: new Date().toISOString() };
    return createRecord<FileUpload>('file_uploads', fileData);
};
export const deleteFileUpload = async (id: string): Promise<void> => {
    const { error } = await supabase.from('file_uploads').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete file upload ${id}`);
};

// Donation Campaigns (Bağış Kampanyaları)
export const getDonationCampaigns = (): Promise<DonationCampaign[]> => getAll<DonationCampaign>('donation_campaigns');
export const getDonationCampaignById = async (id: string): Promise<DonationCampaign> => {
    const { data, error } = await supabase.from('donation_campaigns').select('*').eq('id', id).single();
    if (error) handleSupabaseError(error, `get donation campaign ${id}`);
    return data as DonationCampaign;
};
export const createDonationCampaign = (campaign: Omit<DonationCampaign, 'id' | 'created_at'>): Promise<DonationCampaign> => {
    const campaignData = { ...campaign, created_at: new Date().toISOString() };
    return createRecord<DonationCampaign>('donation_campaigns', campaignData);
};
export const updateDonationCampaign = async (id: string, campaign: Partial<DonationCampaign>): Promise<DonationCampaign> => {
    const { data, error } = await supabase.from('donation_campaigns').update(campaign).eq('id', id).select();
    if (error) handleSupabaseError(error, `update donation campaign ${id}`);
    if (!data || data.length === 0) throw new Error("Kampanya güncellendikten sonra veri alınamadı.");
    return data[0] as DonationCampaign;
};
export const deleteDonationCampaign = async (id: string): Promise<void> => {
    const { error } = await supabase.from('donation_campaigns').delete().eq('id', id);
    if (error) handleSupabaseError(error, `delete donation campaign ${id}`);
};
