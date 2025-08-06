# KAFKASDER Dernek Yönetim Paneli - Servisler ve API Dokümantasyonu

## 1. Genel Bakış

KAFKASDER projesinde servis katmanı, Supabase ile frontend arasındaki tüm veri işlemlerini yönetir. Bu dokümantasyon, tüm servislerin, API çağrılarının ve veri akışının detaylı açıklamalarını içermektedir.

## 2. Servis Mimarisi

### 2.1 Katmanlı Yapı
```
Frontend Components
       ↓
Custom Hooks (useData, usePerson, etc.)
       ↓
Service Layer (personService, donationService, etc.)
       ↓
Supabase Client
       ↓
Supabase Database
```

### 2.2 Servis Kategorileri
- **Core Services**: Temel CRUD işlemleri
- **Business Services**: İş mantığı servisleri
- **Integration Services**: Dış API entegrasyonları
- **Utility Services**: Yardımcı servisler

## 3. Core Services

### 3.1 personService.ts

```typescript
interface PersonService {
  // CRUD Operations
  getAll(filters?: PersonFilters): Promise<Person[]>;
  getById(id: string): Promise<Person | null>;
  create(person: CreatePersonRequest): Promise<Person>;
  update(id: string, person: UpdatePersonRequest): Promise<Person>;
  delete(id: string): Promise<void>;
  
  // Business Operations
  search(query: string): Promise<Person[]>;
  getByIdentityNumber(tcKimlikNo: string): Promise<Person | null>;
  getFamily(personId: string): Promise<Person[]>;
  getAidHistory(personId: string): Promise<YardimBasvurusu[]>;
  getDonationHistory(personId: string): Promise<Bagis[]>;
  
  // Bulk Operations
  bulkCreate(people: CreatePersonRequest[]): Promise<Person[]>;
  bulkUpdate(updates: { id: string; data: UpdatePersonRequest }[]): Promise<Person[]>;
  bulkDelete(ids: string[]): Promise<void>;
  
  // File Operations
  uploadDocument(personId: string, file: File, type: BelgeTuru): Promise<PersonelBelge>;
  uploadPhoto(personId: string, file: File): Promise<PersonelFotograf>;
  deleteDocument(documentId: string): Promise<void>;
  deletePhoto(photoId: string): Promise<void>;
}

class PersonServiceImpl implements PersonService {
  private supabase = supabase;
  
  async getAll(filters?: PersonFilters): Promise<Person[]> {
    let query = this.supabase
      .from('people')
      .select(`
        *,
        person_documents(*),
        person_photos(*),
        person_notes(*),
        aid_applications(*),
        donations(*)
      `);
    
    // Apply filters
    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.membershipType) {
      query = query.eq('membership_type', filters.membershipType);
    }
    
    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    
    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Kişiler getirilemedi: ${error.message}`);
    }
    
    return data || [];
  }
  
  async getById(id: string): Promise<Person | null> {
    const { data, error } = await this.supabase
      .from('people')
      .select(`
        *,
        person_documents(*),
        person_photos(*),
        person_notes(*),
        aid_applications(*),
        donations(*),
        emergency_contacts(*),
        family_members(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Kişi getirilemedi: ${error.message}`);
    }
    
    return data;
  }
  
  async create(person: CreatePersonRequest): Promise<Person> {
    // Validate required fields
    this.validatePersonData(person);
    
    // Check for duplicate identity number
    if (person.tc_kimlik_no) {
      const existing = await this.getByIdentityNumber(person.tc_kimlik_no);
      if (existing) {
        throw new Error('Bu TC Kimlik Numarası ile kayıtlı kişi bulunmaktadır.');
      }
    }
    
    const { data, error } = await this.supabase
      .from('people')
      .insert(person)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Kişi oluşturulamadı: ${error.message}`);
    }
    
    return data;
  }
  
  async update(id: string, person: UpdatePersonRequest): Promise<Person> {
    this.validatePersonData(person);
    
    const { data, error } = await this.supabase
      .from('people')
      .update({
        ...person,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Kişi güncellenemedi: ${error.message}`);
    }
    
    return data;
  }
  
  async search(query: string): Promise<Person[]> {
    const { data, error } = await this.supabase
      .from('people')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,tc_kimlik_no.ilike.%${query}%`)
      .limit(50);
    
    if (error) {
      throw new Error(`Arama yapılamadı: ${error.message}`);
    }
    
    return data || [];
  }
  
  private validatePersonData(person: Partial<Person>): void {
    if (person.tc_kimlik_no && !this.isValidTCKN(person.tc_kimlik_no)) {
      throw new Error('Geçersiz TC Kimlik Numarası');
    }
    
    if (person.email && !this.isValidEmail(person.email)) {
      throw new Error('Geçersiz email adresi');
    }
    
    if (person.phone && !this.isValidPhone(person.phone)) {
      throw new Error('Geçersiz telefon numarası');
    }
  }
  
  private isValidTCKN(tcKimlikNo: string): boolean {
    // TC Kimlik No validation logic
    if (!/^[1-9][0-9]{10}$/.test(tcKimlikNo)) return false;
    
    const digits = tcKimlikNo.split('').map(Number);
    const checksum1 = ((digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7 - 
                      (digits[1] + digits[3] + digits[5] + digits[7])) % 10;
    const checksum2 = (digits[0] + digits[1] + digits[2] + digits[3] + digits[4] + 
                      digits[5] + digits[6] + digits[7] + digits[8] + digits[9]) % 10;
    
    return checksum1 === digits[9] && checksum2 === digits[10];
  }
  
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  private isValidPhone(phone: string): boolean {
    return /^(\+90|0)?[5][0-9]{9}$/.test(phone.replace(/\s/g, ''));
  }
}

export const personService = new PersonServiceImpl();
```

### 3.2 donationService.ts

```typescript
interface DonationService {
  getAll(filters?: DonationFilters): Promise<Bagis[]>;
  getById(id: string): Promise<Bagis | null>;
  create(donation: CreateDonationRequest): Promise<Bagis>;
  update(id: string, donation: UpdateDonationRequest): Promise<Bagis>;
  delete(id: string): Promise<void>;
  
  // Business Operations
  getDonationsByPerson(personId: string): Promise<Bagis[]>;
  getDonationsByDateRange(start: Date, end: Date): Promise<Bagis[]>;
  getDonationsByType(type: BagisTuru): Promise<Bagis[]>;
  getTotalDonations(filters?: DonationFilters): Promise<number>;
  
  // Receipt Operations
  generateReceipt(donationId: string): Promise<Blob>;
  sendReceiptEmail(donationId: string, email: string): Promise<void>;
  
  // Statistics
  getDonationStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<DonationStats>;
  getTopDonors(limit: number): Promise<TopDonor[]>;
}

class DonationServiceImpl implements DonationService {
  private supabase = supabase;
  
  async getAll(filters?: DonationFilters): Promise<Bagis[]> {
    let query = this.supabase
      .from('donations')
      .select(`
        *,
        donor:people(id, first_name, last_name, phone, email)
      `);
    
    if (filters?.donorId) {
      query = query.eq('donor_id', filters.donorId);
    }
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.dateRange) {
      query = query
        .gte('donation_date', filters.dateRange.start)
        .lte('donation_date', filters.dateRange.end);
    }
    
    if (filters?.amountRange) {
      query = query
        .gte('amount', filters.amountRange.min)
        .lte('amount', filters.amountRange.max);
    }
    
    const { data, error } = await query.order('donation_date', { ascending: false });
    
    if (error) {
      throw new Error(`Bağışlar getirilemedi: ${error.message}`);
    }
    
    return data || [];
  }
  
  async create(donation: CreateDonationRequest): Promise<Bagis> {
    this.validateDonationData(donation);
    
    const { data, error } = await this.supabase
      .from('donations')
      .insert({
        ...donation,
        receipt_number: await this.generateReceiptNumber(),
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        donor:people(id, first_name, last_name, phone, email)
      `)
      .single();
    
    if (error) {
      throw new Error(`Bağış oluşturulamadı: ${error.message}`);
    }
    
    // Send receipt email if email provided
    if (data.donor?.email) {
      await this.sendReceiptEmail(data.id, data.donor.email);
    }
    
    return data;
  }
  
  async generateReceipt(donationId: string): Promise<Blob> {
    const donation = await this.getById(donationId);
    if (!donation) {
      throw new Error('Bağış bulunamadı');
    }
    
    // Generate PDF receipt using jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Add receipt content
    doc.setFontSize(20);
    doc.text('KAFKASDER - Bağış Makbuzu', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Makbuz No: ${donation.receipt_number}`, 20, 50);
    doc.text(`Tarih: ${new Date(donation.donation_date).toLocaleDateString('tr-TR')}`, 20, 60);
    doc.text(`Bağışçı: ${donation.donor?.first_name} ${donation.donor?.last_name}`, 20, 70);
    doc.text(`Miktar: ${donation.amount.toLocaleString('tr-TR')} TL`, 20, 80);
    doc.text(`Tür: ${donation.type}`, 20, 90);
    
    if (donation.description) {
      doc.text(`Açıklama: ${donation.description}`, 20, 100);
    }
    
    return doc.output('blob');
  }
  
  async getDonationStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<DonationStats> {
    const { data, error } = await this.supabase
      .rpc('get_donation_stats', { period_type: period });
    
    if (error) {
      throw new Error(`İstatistikler getirilemedi: ${error.message}`);
    }
    
    return data;
  }
  
  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { data, error } = await this.supabase
      .from('donations')
      .select('receipt_number')
      .like('receipt_number', `${year}%`)
      .order('receipt_number', { ascending: false })
      .limit(1);
    
    if (error) {
      throw new Error('Makbuz numarası oluşturulamadı');
    }
    
    const lastNumber = data?.[0]?.receipt_number;
    const nextNumber = lastNumber ? 
      parseInt(lastNumber.split('-')[1]) + 1 : 1;
    
    return `${year}-${nextNumber.toString().padStart(6, '0')}`;
  }
  
  private validateDonationData(donation: Partial<Bagis>): void {
    if (!donation.donor_id) {
      throw new Error('Bağışçı seçilmelidir');
    }
    
    if (!donation.amount || donation.amount <= 0) {
      throw new Error('Geçerli bir miktar girilmelidir');
    }
    
    if (!donation.type) {
      throw new Error('Bağış türü seçilmelidir');
    }
  }
}

export const donationService = new DonationServiceImpl();
```

### 3.3 aidApplicationService.ts

```typescript
interface AidApplicationService {
  getAll(filters?: AidApplicationFilters): Promise<YardimBasvurusu[]>;
  getById(id: string): Promise<YardimBasvurusu | null>;
  create(application: CreateAidApplicationRequest): Promise<YardimBasvurusu>;
  update(id: string, application: UpdateAidApplicationRequest): Promise<YardimBasvurusu>;
  delete(id: string): Promise<void>;
  
  // Status Operations
  approve(id: string, approvedBy: string, notes?: string): Promise<YardimBasvurusu>;
  reject(id: string, rejectedBy: string, reason: string): Promise<YardimBasvurusu>;
  complete(id: string, completedBy: string, notes?: string): Promise<YardimBasvurusu>;
  
  // Business Operations
  getApplicationsByPerson(personId: string): Promise<YardimBasvurusu[]>;
  getApplicationsByStatus(status: BasvuruStatus): Promise<YardimBasvurusu[]>;
  getApplicationsByType(type: YardimTuru): Promise<YardimBasvurusu[]>;
  getPendingApplications(): Promise<YardimBasvurusu[]>;
  
  // Statistics
  getApplicationStats(): Promise<ApplicationStats>;
  getApplicationsByMonth(year: number): Promise<MonthlyApplicationStats[]>;
}

class AidApplicationServiceImpl implements AidApplicationService {
  private supabase = supabase;
  
  async getAll(filters?: AidApplicationFilters): Promise<YardimBasvurusu[]> {
    let query = this.supabase
      .from('aid_applications')
      .select(`
        *,
        applicant:people(id, first_name, last_name, phone, email),
        approved_by_user:user_profiles(id, full_name),
        application_documents(*)
      `);
    
    if (filters?.applicantId) {
      query = query.eq('applicant_id', filters.applicantId);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters?.dateRange) {
      query = query
        .gte('application_date', filters.dateRange.start)
        .lte('application_date', filters.dateRange.end);
    }
    
    const { data, error } = await query.order('application_date', { ascending: false });
    
    if (error) {
      throw new Error(`Başvurular getirilemedi: ${error.message}`);
    }
    
    return data || [];
  }
  
  async approve(id: string, approvedBy: string, notes?: string): Promise<YardimBasvurusu> {
    const { data, error } = await this.supabase
      .from('aid_applications')
      .update({
        status: 'ONAYLANDI',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        approval_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        applicant:people(id, first_name, last_name, phone, email)
      `)
      .single();
    
    if (error) {
      throw new Error(`Başvuru onaylanamadı: ${error.message}`);
    }
    
    // Send notification to applicant
    await this.sendStatusNotification(data, 'ONAYLANDI');
    
    return data;
  }
  
  async reject(id: string, rejectedBy: string, reason: string): Promise<YardimBasvurusu> {
    const { data, error } = await this.supabase
      .from('aid_applications')
      .update({
        status: 'REDDEDILDI',
        rejected_by: rejectedBy,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        applicant:people(id, first_name, last_name, phone, email)
      `)
      .single();
    
    if (error) {
      throw new Error(`Başvuru reddedilemedi: ${error.message}`);
    }
    
    // Send notification to applicant
    await this.sendStatusNotification(data, 'REDDEDILDI');
    
    return data;
  }
  
  private async sendStatusNotification(application: YardimBasvurusu, status: BasvuruStatus): Promise<void> {
    if (!application.applicant?.phone) return;
    
    const message = this.getStatusMessage(application, status);
    
    try {
      await smsService.sendSMS(application.applicant.phone, message);
    } catch (error) {
      console.error('SMS gönderilemedi:', error);
    }
  }
  
  private getStatusMessage(application: YardimBasvurusu, status: BasvuruStatus): string {
    const messages = {
      'ONAYLANDI': `Sayın ${application.applicant?.first_name}, ${application.type} başvurunuz onaylanmıştır. Detaylar için derneğimizi arayabilirsiniz.`,
      'REDDEDILDI': `Sayın ${application.applicant?.first_name}, ${application.type} başvurunuz maalesef reddedilmiştir. Detaylar için derneğimizi arayabilirsiniz.`,
      'TAMAMLANDI': `Sayın ${application.applicant?.first_name}, ${application.type} yardımınız tamamlanmıştır.`
    };
    
    return messages[status] || 'Başvuru durumunuz güncellenmiştir.';
  }
}

export const aidApplicationService = new AidApplicationServiceImpl();
```

## 4. Business Services

### 4.1 orphanService.ts

```typescript
interface OrphanService {
  getOrphans(filters?: OrphanFilters): Promise<Person[]>;
  assignSponsor(orphanId: string, sponsorId: string): Promise<void>;
  removeSponsor(orphanId: string): Promise<void>;
  getMonthlySupport(orphanId: string): Promise<MonthlySupport[]>;
  addMonthlySupport(support: CreateMonthlySupportRequest): Promise<MonthlySupport>;
  getEducationStatus(orphanId: string): Promise<EducationStatus>;
  updateEducationStatus(orphanId: string, status: UpdateEducationStatusRequest): Promise<EducationStatus>;
}

class OrphanServiceImpl implements OrphanService {
  private supabase = supabase;
  
  async getOrphans(filters?: OrphanFilters): Promise<Person[]> {
    let query = this.supabase
      .from('people')
      .select(`
        *,
        sponsor:people!sponsor_id(id, first_name, last_name, phone),
        monthly_supports(*),
        education_status(*)
      `)
      .eq('is_orphan', true);
    
    if (filters?.hasActiveSponsor !== undefined) {
      if (filters.hasActiveSponsor) {
        query = query.not('sponsor_id', 'is', null);
      } else {
        query = query.is('sponsor_id', null);
      }
    }
    
    if (filters?.ageRange) {
      const today = new Date();
      const minBirthDate = new Date(today.getFullYear() - filters.ageRange.max, today.getMonth(), today.getDate());
      const maxBirthDate = new Date(today.getFullYear() - filters.ageRange.min, today.getMonth(), today.getDate());
      
      query = query
        .gte('birth_date', minBirthDate.toISOString())
        .lte('birth_date', maxBirthDate.toISOString());
    }
    
    const { data, error } = await query.order('first_name');
    
    if (error) {
      throw new Error(`Yetimler getirilemedi: ${error.message}`);
    }
    
    return data || [];
  }
  
  async assignSponsor(orphanId: string, sponsorId: string): Promise<void> {
    // Check if sponsor is already assigned to another orphan
    const { data: existingSponsorship } = await this.supabase
      .from('people')
      .select('id')
      .eq('sponsor_id', sponsorId)
      .neq('id', orphanId);
    
    if (existingSponsorship && existingSponsorship.length > 0) {
      throw new Error('Bu sponsor zaten başka bir yetime atanmış durumda.');
    }
    
    const { error } = await this.supabase
      .from('people')
      .update({
        sponsor_id: sponsorId,
        sponsorship_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orphanId);
    
    if (error) {
      throw new Error(`Sponsor ataması yapılamadı: ${error.message}`);
    }
    
    // Create initial monthly support record
    await this.addMonthlySupport({
      orphan_id: orphanId,
      sponsor_id: sponsorId,
      amount: 500, // Default amount
      support_date: new Date().toISOString(),
      notes: 'Sponsorluk başlangıcı'
    });
  }
}

export const orphanService = new OrphanServiceImpl();
```

### 4.2 scholarshipService.ts

```typescript
interface ScholarshipService {
  getScholarships(filters?: ScholarshipFilters): Promise<Scholarship[]>;
  getApplications(filters?: ScholarshipApplicationFilters): Promise<ScholarshipApplication[]>;
  createApplication(application: CreateScholarshipApplicationRequest): Promise<ScholarshipApplication>;
  evaluateApplication(applicationId: string, evaluation: ApplicationEvaluation): Promise<ScholarshipApplication>;
  assignScholarship(applicationId: string, scholarshipId: string): Promise<void>;
  getPaymentSchedule(scholarshipId: string): Promise<PaymentSchedule[]>;
  processPayment(paymentId: string): Promise<Payment>;
}

class ScholarshipServiceImpl implements ScholarshipService {
  private supabase = supabase;
  
  async createApplication(application: CreateScholarshipApplicationRequest): Promise<ScholarshipApplication> {
    // Validate application data
    this.validateApplicationData(application);
    
    // Check if student already has an active application
    const { data: existingApplication } = await this.supabase
      .from('scholarship_applications')
      .select('id')
      .eq('student_id', application.student_id)
      .eq('status', 'PENDING');
    
    if (existingApplication && existingApplication.length > 0) {
      throw new Error('Bu öğrenci için zaten beklemede olan bir başvuru bulunmaktadır.');
    }
    
    const { data, error } = await this.supabase
      .from('scholarship_applications')
      .insert({
        ...application,
        application_number: await this.generateApplicationNumber(),
        status: 'PENDING',
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        student:people(id, first_name, last_name, phone, email)
      `)
      .single();
    
    if (error) {
      throw new Error(`Burs başvurusu oluşturulamadı: ${error.message}`);
    }
    
    return data;
  }
  
  async evaluateApplication(applicationId: string, evaluation: ApplicationEvaluation): Promise<ScholarshipApplication> {
    const { data, error } = await this.supabase
      .from('scholarship_applications')
      .update({
        evaluation_score: evaluation.score,
        evaluation_notes: evaluation.notes,
        evaluated_by: evaluation.evaluatedBy,
        evaluated_at: new Date().toISOString(),
        status: evaluation.score >= 70 ? 'APPROVED' : 'REJECTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        student:people(id, first_name, last_name, phone, email)
      `)
      .single();
    
    if (error) {
      throw new Error(`Başvuru değerlendirilemedi: ${error.message}`);
    }
    
    return data;
  }
  
  private async generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { data, error } = await this.supabase
      .from('scholarship_applications')
      .select('application_number')
      .like('application_number', `BURS-${year}%`)
      .order('application_number', { ascending: false })
      .limit(1);
    
    if (error) {
      throw new Error('Başvuru numarası oluşturulamadı');
    }
    
    const lastNumber = data?.[0]?.application_number;
    const nextNumber = lastNumber ? 
      parseInt(lastNumber.split('-')[2]) + 1 : 1;
    
    return `BURS-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }
  
  private validateApplicationData(application: Partial<ScholarshipApplication>): void {
    if (!application.student_id) {
      throw new Error('Öğrenci seçilmelidir');
    }
    
    if (!application.school_name) {
      throw new Error('Okul adı girilmelidir');
    }
    
    if (!application.gpa || application.gpa < 0 || application.gpa > 4) {
      throw new Error('Geçerli bir not ortalaması girilmelidir (0-4 arası)');
    }
  }
}

export const scholarshipService = new ScholarshipServiceImpl();
```

## 5. Integration Services

### 5.1 smsService.ts

```typescript
interface SMSService {
  sendSMS(phone: string, message: string): Promise<SMSResponse>;
  sendBulkSMS(recipients: SMSRecipient[], message: string): Promise<BulkSMSResponse>;
  getDeliveryReport(messageId: string): Promise<DeliveryReport>;
  getBalance(): Promise<SMSBalance>;
  validatePhone(phone: string): boolean;
}

interface SMSRecipient {
  phone: string;
  name?: string;
  variables?: Record<string, string>;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

class SMSServiceImpl implements SMSService {
  private apiUrl = process.env.REACT_APP_SMS_API_URL;
  private apiKey = process.env.REACT_APP_SMS_API_KEY;
  private sender = process.env.REACT_APP_SMS_SENDER || 'KAFKASDER';
  
  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    if (!this.validatePhone(phone)) {
      throw new Error('Geçersiz telefon numarası');
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          sender: this.sender,
          phone: this.formatPhone(phone),
          message: message,
          encoding: 'turkish'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'SMS gönderilemedi');
      }
      
      // Log SMS to database
      await this.logSMS(phone, message, data.messageId, 'SENT');
      
      return {
        success: true,
        messageId: data.messageId,
        cost: data.cost
      };
    } catch (error) {
      await this.logSMS(phone, message, null, 'FAILED', error.message);
      throw error;
    }
  }
  
  async sendBulkSMS(recipients: SMSRecipient[], message: string): Promise<BulkSMSResponse> {
    const validRecipients = recipients.filter(r => this.validatePhone(r.phone));
    
    if (validRecipients.length === 0) {
      throw new Error('Geçerli telefon numarası bulunamadı');
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/bulk-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          sender: this.sender,
          recipients: validRecipients.map(r => ({
            phone: this.formatPhone(r.phone),
            message: this.replaceVariables(message, r.variables || {})
          })),
          encoding: 'turkish'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Toplu SMS gönderilemedi');
      }
      
      // Log bulk SMS to database
      await this.logBulkSMS(validRecipients, message, data.batchId);
      
      return {
        success: true,
        batchId: data.batchId,
        sentCount: data.sentCount,
        failedCount: data.failedCount,
        totalCost: data.totalCost
      };
    } catch (error) {
      throw error;
    }
  }
  
  validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\s/g, '');
    return /^(\+90|0)?[5][0-9]{9}$/.test(cleanPhone);
  }
  
  private formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.startsWith('+90')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      return '+90' + cleanPhone.substring(1);
    } else {
      return '+90' + cleanPhone;
    }
  }
  
  private replaceVariables(message: string, variables: Record<string, string>): string {
    let result = message;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }
  
  private async logSMS(phone: string, message: string, messageId: string | null, status: string, error?: string): Promise<void> {
    try {
      await supabase.from('sms_logs').insert({
        phone,
        message,
        message_id: messageId,
        status,
        error_message: error,
        sent_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('SMS log kaydedilemedi:', logError);
    }
  }
  
  private async logBulkSMS(recipients: SMSRecipient[], message: string, batchId: string): Promise<void> {
    try {
      const logs = recipients.map(recipient => ({
        phone: recipient.phone,
        message: this.replaceVariables(message, recipient.variables || {}),
        batch_id: batchId,
        status: 'SENT',
        sent_at: new Date().toISOString()
      }));
      
      await supabase.from('sms_logs').insert(logs);
    } catch (logError) {
      console.error('Toplu SMS log kaydedilemedi:', logError);
    }
  }
}

export const smsService = new SMSServiceImpl();
```

### 5.2 whatsappService.ts

```typescript
interface WhatsAppService {
  sendMessage(phone: string, message: string): Promise<WhatsAppResponse>;
  sendTemplate(phone: string, templateName: string, variables: string[]): Promise<WhatsAppResponse>;
  sendDocument(phone: string, documentUrl: string, caption?: string): Promise<WhatsAppResponse>;
  getMessageStatus(messageId: string): Promise<MessageStatus>;
}

class WhatsAppServiceImpl implements WhatsAppService {
  private apiUrl = process.env.REACT_APP_WHATSAPP_API_URL;
  private accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN;
  private phoneNumberId = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID;
  
  async sendMessage(phone: string, message: string): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhone(phone),
          type: 'text',
          text: {
            body: message
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'WhatsApp mesajı gönderilemedi');
      }
      
      // Log message to database
      await this.logMessage(phone, message, data.messages[0].id, 'SENT');
      
      return {
        success: true,
        messageId: data.messages[0].id
      };
    } catch (error) {
      await this.logMessage(phone, message, null, 'FAILED', error.message);
      throw error;
    }
  }
  
  async sendTemplate(phone: string, templateName: string, variables: string[]): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhone(phone),
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'tr'
            },
            components: [
              {
                type: 'body',
                parameters: variables.map(variable => ({
                  type: 'text',
                  text: variable
                }))
              }
            ]
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'WhatsApp şablonu gönderilemedi');
      }
      
      return {
        success: true,
        messageId: data.messages[0].id
      };
    } catch (error) {
      throw error;
    }
  }
  
  private formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.startsWith('+')) {
      return cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('0')) {
      return '90' + cleanPhone.substring(1);
    } else {
      return '90' + cleanPhone;
    }
  }
  
  private async logMessage(phone: string, message: string, messageId: string | null, status: string, error?: string): Promise<void> {
    try {
      await supabase.from('whatsapp_logs').insert({
        phone,
        message,
        message_id: messageId,
        status,
        error_message: error,
        sent_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('WhatsApp log kaydedilemedi:', logError);
    }
  }
}

export const whatsappService = new WhatsAppServiceImpl();
```

## 6. Utility Services

### 6.1 fileService.ts

```typescript
interface FileService {
  uploadFile(file: File, bucket: string, path?: string): Promise<FileUploadResponse>;
  deleteFile(bucket: string, path: string): Promise<void>;
  getFileUrl(bucket: string, path: string): string;
  downloadFile(bucket: string, path: string): Promise<Blob>;
  validateFile(file: File, options?: FileValidationOptions): boolean;
}

interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

class FileServiceImpl implements FileService {
  private supabase = supabase;
  
  async uploadFile(file: File, bucket: string, path?: string): Promise<FileUploadResponse> {
    // Validate file
    if (!this.validateFile(file)) {
      throw new Error('Geçersiz dosya');
    }
    
    // Generate unique filename if path not provided
    const fileName = path || `${Date.now()}-${file.name}`;
    
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw new Error(`Dosya yüklenemedi: ${error.message}`);
      }
      
      return {
        success: true,
        path: data.path,
        url: this.getFileUrl(bucket, data.path)
      };
    } catch (error) {
      throw error;
    }
  }
  
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      throw new Error(`Dosya silinemedi: ${error.message}`);
    }
  }
  
  getFileUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
  
  async downloadFile(bucket: string, path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      throw new Error(`Dosya indirilemedi: ${error.message}`);
    }
    
    return data;
  }
  
  validateFile(file: File, options?: FileValidationOptions): boolean {
    const defaultOptions: FileValidationOptions = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // Check file size
    if (file.size > opts.maxSize!) {
      throw new Error(`Dosya boyutu ${(opts.maxSize! / 1024 / 1024).toFixed(1)}MB'dan büyük olamaz`);
    }
    
    // Check file type
    if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
      throw new Error('Desteklenmeyen dosya türü');
    }
    
    // Check file extension
    if (opts.allowedExtensions) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!opts.allowedExtensions.includes(extension)) {
        throw new Error('Desteklenmeyen dosya uzantısı');
      }
    }
    
    return true;
  }
}

export const fileService = new FileServiceImpl();
```

### 6.2 reportService.ts

```typescript
interface ReportService {
  generatePersonReport(filters: PersonFilters): Promise<Blob>;
  generateDonationReport(filters: DonationFilters): Promise<Blob>;
  generateAidApplicationReport(filters: AidApplicationFilters): Promise<Blob>;
  generateFinancialReport(dateRange: DateRange): Promise<Blob>;
  exportToExcel(data: any[], filename: string): Promise<Blob>;
  exportToPDF(data: any[], title: string, columns: ReportColumn[]): Promise<Blob>;
}

interface ReportColumn {
  key: string;
  title: string;
  width?: number;
  format?: (value: any) => string;
}

class ReportServiceImpl implements ReportService {
  async generatePersonReport(filters: PersonFilters): Promise<Blob> {
    const people = await personService.getAll(filters);
    
    const columns: ReportColumn[] = [
      { key: 'first_name', title: 'Ad', width: 100 },
      { key: 'last_name', title: 'Soyad', width: 100 },
      { key: 'tc_kimlik_no', title: 'TC Kimlik No', width: 120 },
      { key: 'phone', title: 'Telefon', width: 120 },
      { key: 'email', title: 'E-posta', width: 150 },
      { key: 'city', title: 'Şehir', width: 100 },
      { key: 'district', title: 'İlçe', width: 100 },
      { key: 'membership_type', title: 'Üyelik Türü', width: 120 },
      { key: 'status', title: 'Durum', width: 100 },
      { 
        key: 'created_at', 
        title: 'Kayıt Tarihi', 
        width: 120,
        format: (value) => new Date(value).toLocaleDateString('tr-TR')
      }
    ];
    
    return this.exportToPDF(people, 'Kişi Listesi Raporu', columns);
  }
  
  async generateDonationReport(filters: DonationFilters): Promise<Blob> {
    const donations = await donationService.getAll(filters);
    
    const columns: ReportColumn[] = [
      { key: 'receipt_number', title: 'Makbuz No', width: 120 },
      { 
        key: 'donor', 
        title: 'Bağışçı', 
        width: 150,
        format: (donor) => `${donor?.first_name} ${donor?.last_name}`
      },
      { 
        key: 'amount', 
        title: 'Miktar', 
        width: 100,
        format: (value) => `${value.toLocaleString('tr-TR')} TL`
      },
      { key: 'type', title: 'Tür', width: 120 },
      { key: 'payment_method', title: 'Ödeme Yöntemi', width: 120 },
      { 
        key: 'donation_date', 
        title: 'Bağış Tarihi', 
        width: 120,
        format: (value) => new Date(value).toLocaleDateString('tr-TR')
      },
      { key: 'description', title: 'Açıklama', width: 200 }
    ];
    
    return this.exportToPDF(donations, 'Bağış Listesi Raporu', columns);
  }
  
  async exportToExcel(data: any[], filename: string): Promise<Blob> {
    const XLSX = await import('xlsx');
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Veri');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }
  
  async exportToPDF(data: any[], title: string, columns: ReportColumn[]): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);
    
    // Prepare table data
    const tableColumns = columns.map(col => col.title);
    const tableRows = data.map(item => 
      columns.map(col => {
        const value = this.getNestedValue(item, col.key);
        return col.format ? col.format(value) : value || '';
      })
    );
    
    // Add table
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255
      },
      columnStyles: columns.reduce((styles, col, index) => {
        if (col.width) {
          styles[index] = { cellWidth: col.width / 4 }; // Convert to mm
        }
        return styles;
      }, {} as any)
    });
    
    return doc.output('blob');
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export const reportService = new ReportServiceImpl();
```

## 7. Error Handling ve Logging

### 7.1 errorHandler.ts

```typescript
interface ErrorHandler {
  handleError(error: Error, context?: string): void;
  logError(error: Error, context?: string, userId?: string): Promise<void>;
  showUserError(message: string, type?: 'error' | 'warning' | 'info'): void;
}

class ErrorHandlerImpl implements ErrorHandler {
  private supabase = supabase;
  
  handleError(error: Error, context?: string): void {
    console.error(`Error in ${context}:`, error);
    
    // Log to database
    this.logError(error, context);
    
    // Show user-friendly message
    this.showUserError(this.getUserFriendlyMessage(error));
  }
  
  async logError(error: Error, context?: string, userId?: string): Promise<void> {
    try {
      await this.supabase.from('error_logs').insert({
        message: error.message,
        stack: error.stack,
        context,
        user_id: userId,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }
  }
  
  showUserError(message: string, type: 'error' | 'warning' | 'info' = 'error'): void {
    // Using react-hot-toast for user notifications
    const toast = require('react-hot-toast');
    
    switch (type) {
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning || toast.error(message);
        break;
      case 'info':
        toast.success(message);
        break;
    }
  }
  
  private getUserFriendlyMessage(error: Error): string {
    const errorMessages: Record<string, string> = {
      'Network Error': 'İnternet bağlantınızı kontrol edin',
      'Unauthorized': 'Bu işlem için yetkiniz bulunmamaktadır',
      'Forbidden': 'Bu işlem için yetkiniz bulunmamaktadır',
      'Not Found': 'Aradığınız kayıt bulunamadı',
      'Validation Error': 'Girdiğiniz bilgileri kontrol edin',
      'Duplicate Entry': 'Bu kayıt zaten mevcut'
    };
    
    // Check for specific error patterns
    for (const [pattern, message] of Object.entries(errorMessages)) {
      if (error.message.includes(pattern)) {
        return message;
      }
    }
    
    // Default message
    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
}

export const errorHandler = new ErrorHandlerImpl();
```

## 8. Performance Optimizasyonu

### 8.1 cacheService.ts

```typescript
interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

class CacheServiceImpl implements CacheService {
  private cache = new Map<string, { value: any; expiry: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const cacheService = new CacheServiceImpl();
```

Bu dokümantasyon, KAFKASDER projesindeki tüm servis katmanının detaylı açıklamalarını içermektedir ve geliştiriciler için kapsamlı bir API referansı oluşturmaktadır.