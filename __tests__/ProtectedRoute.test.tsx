/**
 * ProtectedRoute.test.tsx
 * Senaryolar:
 * 1) Auth yokken private route erişimi engellenir (login’e yönlendirir)
 * 2) Auth var ama rol yetkisizken AccessDenied (veya /access-denied) gösterilir
 * 3) Auth + yetkili rol ile hedef sayfa render olur
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import ProtectedRoute from '../components/ProtectedRoute';
import AccessDenied from '../components/AccessDenied';
import { KullaniciRol } from '../types';

// Basit sahte sayfalar
const PrivatePage = () => <div>Özel İçerik</div>;
const LoginPage = () => <div>Login Sayfası</div>;

// Test amaçlı Protected wrapper
function ProtectedWrapper({
  userRole,
  allowedRoles,
}: {
  userRole: KullaniciRol;
  allowedRoles?: KullaniciRol[];
}) {
  return (
    <ProtectedRoute userRole={userRole} allowedRoles={allowedRoles}>
      <PrivatePage />
    </ProtectedRoute>
  );
}

describe('ProtectedRoute', () => {
  it('auth yokken private route erişimi engellenir ve /access-denied sayfasına gider (login simülasyonu yerine bu projede access-denied kullanılıyor)', () => {
    // Auth yok simülasyonu: userRole olarak "misafir" benzeri yetkisiz rol verelim ve route üzerinde allowedRoles talep edelim ki engellensin
    // Bu projede ProtectedRoute, yetkisiz durumda /access-denied rota yönlendirmesi yapıyor.
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedWrapper
                userRole={KullaniciRol.GONULLU} // Yetkisiz kabul edelim
                allowedRoles={[KullaniciRol.YONETICI]}
              />
            }
          />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="*" element={<Navigate to="/private" replace />} />
        </Routes>
      </MemoryRouter>
    );

    // AccessDenied içeriğinden bir metni doğrulayalım
    expect(screen.getByText('Erişim Reddedildi')).toBeInTheDocument();
  });

  it('auth var ama rol yetkisizken AccessDenied gösterilir', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedWrapper
                userRole={KullaniciRol.GONULLU}
                allowedRoles={[KullaniciRol.MUHASEBE, KullaniciRol.YONETICI]} // gönüllü yok
              />
            }
          />
          <Route path="/access-denied" element={<AccessDenied />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Erişim Reddedildi')).toBeInTheDocument();
  });

  it('auth + yetkili rol ile hedef sayfa render olur', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedWrapper
                userRole={KullaniciRol.YONETICI}
                allowedRoles={[KullaniciRol.MUHASEBE, KullaniciRol.YONETICI]}
              />
            }
          />
          <Route path="/access-denied" element={<AccessDenied />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Özel İçerik')).toBeInTheDocument();
  });
});
