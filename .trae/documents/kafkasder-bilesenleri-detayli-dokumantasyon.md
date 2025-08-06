# KAFKASDER Dernek Yönetim Paneli - Bileşenler Detaylı Dokümantasyonu

## 1. Genel Bakış

KAFKASDER projesinde 70+ React bileşeni bulunmaktadır. Bu dokümantasyon, tüm bileşenlerin detaylı açıklamalarını, props'larını, kullanım örneklerini ve bağımlılıklarını içermektedir.

## 2. Ana Bileşen Kategorileri

### 2.1 Layout Bileşenleri
- **App.tsx**: Ana uygulama bileşeni
- **Sidebar.tsx**: Yan navigasyon menüsü
- **ErrorBoundary.tsx**: Hata yakalama bileşeni
- **ProtectedRoute.tsx**: Yetkilendirme kontrolü

### 2.2 UI Bileşenleri (components/ui/)
- **Button.tsx**: Temel buton bileşeni
- **Card.tsx**: Kart container bileşeni
- **Input.tsx**: Form input bileşeni
- **Modal.tsx**: Modal dialog bileşeni
- **Table.tsx**: Tablo bileşeni
- **LoadingSpinner.tsx**: Yükleme animasyonu

### 2.3 İş Mantığı Bileşenleri
- **Dashboard.tsx**: Ana kontrol paneli
- **KisiYonetimi.tsx**: Kişi yönetim sistemi
- **BagisYonetimi.tsx**: Bağış yönetim sistemi
- **YardimBasvurulari.tsx**: Yardım başvuru sistemi

## 3. Detaylı Bileşen Dokümantasyonu

### 3.1 Ana Layout Bileşenleri

#### App.tsx
```typescript
interface AppProps {}

// Ana uygulama bileşeni
function App(): JSX.Element
```

**Özellikler:**
- Supabase authentication yönetimi
- Route-level lazy loading
- Global state management
- Error boundary wrapper
- Theme provider

**Kullanılan Hooks:**
- `useState`: User state, loading state, sidebar state
- `useEffect`: Auth state listener

**Bağımlılıklar:**
- `@supabase/supabase-js`
- `react-router-dom`
- `react-hot-toast`

#### Sidebar.tsx
```typescript
interface SidebarProps {
  user: {
    id: number;
    adSoyad: string;
    email: string;
    rol: KullaniciRol;
    telefon: string;
    profilFotoUrl: string;
  };
  onSignOut: () => void;
  isOpen: boolean;
}

function Sidebar({ user, onSignOut, isOpen }: SidebarProps): JSX.Element
```

**Özellikler:**
- Rol tabanlı menü görünümü
- Responsive design (mobile hamburger menu)
- Aktif sayfa highlighting
- Kullanıcı profil bilgileri
- Çıkış yapma fonksiyonu

**Alt Bileşenler:**
- `NavigationItems.tsx`: Menü öğeleri

#### ProtectedRoute.tsx
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  userRole: KullaniciRol;
  requiredRoles?: KullaniciRol[];
}

function ProtectedRoute({ children, userRole, requiredRoles }: ProtectedRouteProps): JSX.Element
```

**Özellikler:**
- Rol tabanlı erişim kontrolü
- Yetkisiz erişim yönlendirmesi
- Loading state handling

### 3.2 UI Bileşenleri

#### Button.tsx
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon, 
  children, 
  className, 
  disabled,
  ...props 
}: ButtonProps): JSX.Element
```

**Özellikler:**
- Çoklu variant desteği
- Loading state
- İkon desteği
- Accessibility (ARIA) desteği
- TailwindCSS styling

**Kullanım Örneği:**
```typescript
<Button 
  variant="primary" 
  size="lg" 
  loading={isSubmitting}
  icon={<PlusIcon className="w-4 h-4" />}
  onClick={handleSubmit}
>
  Kaydet
</Button>
```

#### Modal.tsx
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  showCloseButton = true 
}: ModalProps): JSX.Element | null
```

**Özellikler:**
- Portal rendering
- Backdrop click to close
- ESC key handling
- Focus trap
- Animation support

#### Table.tsx
```typescript
interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T) => void;
}

function Table<T>({ 
  data, 
  columns, 
  loading, 
  pagination, 
  rowKey, 
  onRowClick 
}: TableProps<T>): JSX.Element
```

**Özellikler:**
- Generic type support
- Sorting functionality
- Pagination
- Custom cell rendering
- Row click handling
- Loading state

### 3.3 İş Mantığı Bileşenleri

#### Dashboard.tsx
```typescript
interface DashboardProps {}

function Dashboard(): JSX.Element
```

**Özellikler:**
- İstatistik kartları
- Son aktiviteler listesi
- Grafik gösterimleri
- Hızlı erişim linkleri
- Real-time data updates

**Kullanılan Hooks:**
- `useState`: Stats data, activities data
- `useEffect`: Data fetching
- `useMemo`: Computed statistics

**Alt Bileşenler:**
- Stat cards
- Activity feed
- Quick actions

#### KisiYonetimi.tsx
```typescript
interface KisiYonetimiProps {}

function KisiYonetimi(): JSX.Element
```

**Özellikler:**
- Kişi listesi görüntüleme
- Filtreleme ve arama
- Toplu işlemler
- Excel import/export
- Sayfalama

**State Management:**
```typescript
const [people, setPeople] = useState<Person[]>([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState<PersonFilters>({});
const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
const [currentPage, setCurrentPage] = useState(1);
```

**Alt Bileşenler:**
- `KisiTable.tsx`: Kişi tablosu
- `KisiFilters.tsx`: Filtreleme bileşeni
- `KisiToolbar.tsx`: Araç çubuğu

#### BagisYonetimi.tsx
```typescript
interface BagisYonetimiProps {}

function BagisYonetimi(): JSX.Element
```

**Özellikler:**
- Bağış listesi ve detayları
- Bağış türü filtreleme
- Makbuz oluşturma
- Grafik raporları
- Bağışçı yönetimi

**State Management:**
```typescript
const [donations, setDonations] = useState<Bagis[]>([]);
const [selectedDonation, setSelectedDonation] = useState<Bagis | null>(null);
const [showAddModal, setShowAddModal] = useState(false);
const [filters, setFilters] = useState<DonationFilters>({});
```

#### YardimBasvurulari.tsx
```typescript
interface YardimBasvurulariProps {}

function YardimBasvurulari(): JSX.Element
```

**Özellikler:**
- Başvuru listesi ve detayları
- Durum bazlı filtreleme
- Onay süreçleri
- Belge yönetimi
- Ödeme takibi

**State Management:**
```typescript
const [applications, setApplications] = useState<YardimBasvurusu[]>([]);
const [selectedApplication, setSelectedApplication] = useState<YardimBasvurusu | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [statusFilter, setStatusFilter] = useState<BasvuruStatus | 'ALL'>('ALL');
```

### 3.4 Özel Modül Bileşenleri

#### YetimYonetimi.tsx
```typescript
interface YetimYonetimiProps {}

function YetimYonetimi(): JSX.Element
```

**Özellikler:**
- Yetim kayıt sistemi
- Sponsor eşleştirme
- Aylık destek takibi
- Eğitim durumu izleme
- Fotoğraf galerisi

#### OgrenciBurslari.tsx
```typescript
interface OgrenciBurslariProps {}

function OgrenciBurslari(): JSX.Element
```

**Özellikler:**
- Burs başvuru yönetimi
- Akademik başarı takibi
- Ödeme planlaması
- Bursiyer profilleri

#### HukukiYardim.tsx
```typescript
interface HukukiYardimProps {}

function HukukiYardim(): JSX.Element
```

**Özellikler:**
- Dava takip sistemi
- Avukat atama
- Duruşma takvimi
- Hukuki belge yönetimi

#### StokYonetimi.tsx
```typescript
interface StokYonetimiProps {}

function StokYonetimi(): JSX.Element
```

**Özellikler:**
- Depo stok takibi
- Minimum stok uyarıları
- Ürün kategorizasyonu
- Giriş/çıkış işlemleri

#### HaritaModulu.tsx
```typescript
interface HaritaModuluProps {}

function HaritaModulu(): JSX.Element
```

**Özellikler:**
- Leaflet harita entegrasyonu
- Kişi lokasyonları
- Kumbara konumları
- Coğrafi filtreleme

**Bağımlılıklar:**
- `react-leaflet`
- `leaflet`

### 3.5 Form Bileşenleri

#### KisiDetay.tsx
```typescript
interface KisiDetayProps {
  personId: string;
  onClose: () => void;
}

function KisiDetay({ personId, onClose }: KisiDetayProps): JSX.Element
```

**Özellikler:**
- Tab-based layout
- Form validation
- Dosya yükleme
- Fotoğraf galerisi
- Not sistemi
- Yardım geçmişi

**Tab Yapısı:**
- Genel Bilgiler
- İletişim Bilgileri
- Aile Bilgileri
- Sağlık Bilgileri
- Belgeler
- Fotoğraflar
- Notlar
- Yardım Geçmişi

### 3.6 Raporlama Bileşenleri

#### RaporlamaAnalitik.tsx
```typescript
interface RaporlamaAnalitikProps {}

function RaporlamaAnalitik(): JSX.Element
```

**Özellikler:**
- Grafik gösterimleri (Recharts)
- Tarih aralığı seçimi
- Excel export
- PDF rapor oluşturma
- Filtreleme seçenekleri

**Grafik Türleri:**
- Bar Chart: Aylık bağış miktarları
- Line Chart: Başvuru trendleri
- Pie Chart: Bağış türü dağılımı
- Area Chart: Yardım kategorileri

#### FinansalKayitlar.tsx
```typescript
interface FinansalKayitlarProps {}

function FinansalKayitlar(): JSX.Element
```

**Özellikler:**
- Gelir-gider takibi
- Kategori bazlı raporlama
- Bütçe karşılaştırması
- Finansal grafikler

### 3.7 İletişim Bileşenleri

#### TopluIletisim.tsx
```typescript
interface TopluIletisimProps {}

function TopluIletisim(): JSX.Element
```

**Özellikler:**
- SMS/Email toplu gönderim
- Şablon yönetimi
- Alıcı seçimi
- Gönderim zamanlaması
- Delivery raporları

#### MesajRaporlari.tsx
```typescript
interface MesajRaporlariProps {}

function MesajRaporlari(): JSX.Element
```

**Özellikler:**
- Gönderim istatistikleri
- Açılma oranları
- Başarısız gönderimler
- Grafik raporları

### 3.8 Sistem Bileşenleri

#### KullaniciYonetimi.tsx
```typescript
interface KullaniciYonetimiProps {}

function KullaniciYonetimi(): JSX.Element
```

**Özellikler:**
- Kullanıcı listesi
- Rol atama
- Yetki yönetimi
- Aktivite logları

#### Ayarlar.tsx
```typescript
interface AyarlarProps {}

function Ayarlar(): JSX.Element
```

**Özellikler:**
- Sistem parametreleri
- Email/SMS konfigürasyonu
- Yedekleme ayarları
- Güvenlik ayarları

## 4. Hook'lar ve Yardımcı Fonksiyonlar

### 4.1 Custom Hooks

#### useData.ts
```typescript
interface UseDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useData<T>(tableName: string, filters?: any): UseDataReturn<T>
```

**Özellikler:**
- Generic data fetching
- Loading state management
- Error handling
- Refetch functionality

#### usePWA.ts
```typescript
interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

function usePWA(): UsePWAReturn
```

**Özellikler:**
- PWA install prompt
- Installation status
- Service worker management

### 4.2 Utility Functions

#### format.ts
```typescript
// Tarih formatlama
function formatDate(date: string | Date, format?: string): string

// Para birimi formatlama
function formatCurrency(amount: number, currency?: string): string

// Telefon numarası formatlama
function formatPhone(phone: string): string

// Kimlik numarası maskeleme
function maskIdentityNumber(identityNumber: string): string
```

#### validation.ts
```typescript
// Form validasyon kuralları
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

function validateField(value: any, rules: ValidationRule[]): string | null

// Kimlik numarası validasyonu
function validateTCKN(tcKimlikNo: string): boolean

// Email validasyonu
function validateEmail(email: string): boolean

// Telefon numarası validasyonu
function validatePhone(phone: string): boolean
```

## 5. Bileşen İletişimi ve State Management

### 5.1 Props Drilling Çözümleri

```typescript
// Context API kullanımı
const UserContext = createContext<UserContextType | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  
  return (
    <UserContext.Provider value={{ user, setUser, permissions, setPermissions }}>
      {children}
    </UserContext.Provider>
  );
}

function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

### 5.2 Event Handling Patterns

```typescript
// Callback pattern
interface PersonFormProps {
  person?: Person;
  onSave: (person: Person) => Promise<void>;
  onCancel: () => void;
}

// Event emitter pattern (custom events)
class EventBus {
  private events: { [key: string]: Function[] } = {};
  
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event: string, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventBus();
```

## 6. Test Stratejisi

### 6.1 Unit Tests

```typescript
// Button component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 6.2 Integration Tests

```typescript
// KisiYonetimi integration test
import { render, screen, waitFor } from '@testing-library/react';
import { KisiYonetimi } from '../KisiYonetimi';
import { mockPeople } from '../../data/mockPeople';

// Mock Supabase
jest.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: mockPeople, error: null }))
      }))
    }))
  }
}));

describe('KisiYonetimi Integration', () => {
  test('loads and displays people list', async () => {
    render(<KisiYonetimi />);
    
    await waitFor(() => {
      expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
    });
  });
});
```

## 7. Performance Optimizasyonu

### 7.1 React.memo Kullanımı

```typescript
// Expensive component memoization
const PersonCard = React.memo(({ person, onEdit }: PersonCardProps) => {
  return (
    <div className="person-card">
      <h3>{person.first_name} {person.last_name}</h3>
      <p>{person.phone}</p>
      <Button onClick={() => onEdit(person)}>Düzenle</Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.person.id === nextProps.person.id &&
    prevProps.person.updated_at === nextProps.person.updated_at
  );
});
```

### 7.2 Virtual Scrolling

```typescript
// Large list optimization
import { FixedSizeList as List } from 'react-window';

const VirtualizedPersonList = ({ people }: { people: Person[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PersonCard person={people[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={people.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## 8. Accessibility (A11y)

### 8.1 ARIA Attributes

```typescript
// Accessible button component
const AccessibleButton = ({ 
  children, 
  loading, 
  disabled, 
  ariaLabel,
  ...props 
}: ButtonProps) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled || loading}
    >
      {loading && <span aria-hidden="true">⏳</span>}
      {children}
    </button>
  );
};
```

### 8.2 Keyboard Navigation

```typescript
// Modal with focus management
const AccessibleModal = ({ isOpen, onClose, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="modal"
    >
      {children}
    </div>
  );
};
```

Bu dokümantasyon, KAFKASDER projesindeki tüm bileşenlerin detaylı açıklamalarını içermektedir ve geliştiriciler için kapsamlı bir referans kaynağı oluşturmaktadır.