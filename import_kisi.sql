-- public.import_kisi tablosu oluşturma
create table if not exists public.import_kisi (
  id integer,
  ad_soyad text,
  kimlik_no text,
  uyruk text,
  ulke text,
  sehir text,
  yerlesim text,
  mahalle text,
  adres text,
  aile_kisi_sayisi integer,
  bagli_yetim text,
  bagli_kart text,
  telefon text,
  kayit_tarihi date,
  kaydi_acan_birim text,
  kategori text,
  tur text,
  fon_bolgesi text,
  toplam_tutar numeric,
  iban text
);

-- Kontrol sorguları
-- select count(*) as row_count from public.import_kisi;
-- select id, ad_soyad, telefon, kayit_tarihi from public.import_kisi order by id limit 10;

-- NOT:
-- Supabase SQL Editor yerel dosya yolunu doğrudan okuyamaz.
-- CSV içe aktarmanın en pratik yolu psql üzerinden \copy komutudur:
-- \copy public.import_kisi from 'Export.normalized.sample10.csv' with (format csv, header true, delimiter ';', encoding 'UTF8');
