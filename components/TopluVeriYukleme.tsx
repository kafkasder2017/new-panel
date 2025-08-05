import React, { useMemo, useState } from "react";
import Papa from "papaparse";
import { supabase } from "../services/supabaseClient";

type Row = Record<string, string>;

type MappedRow = {
  ad?: string | null;
  soyad?: string | null;
  uyruk?: string | null;
  dogum_tarihi?: string | null; // ISO 'YYYY-MM-DD'
  cinsiyet?: string | null;
  kan_grubu?: string | null;
  kimlik_no?: string | null;
  eposta?: string | null;
  cep_telefonu?: string | null;
  sabit_telefon?: string | null;
  yurtdisi_telefon?: string | null;
  ulke?: string | null;
  sehir?: string | null;
  ilce?: string | null;
  mahalle?: string | null;
  adres?: string | null;
  iban?: string | null;
};

const csvHeadersTr = [
  "Ad",
  "Soyad",
  "Uyruk",
  "Doğum Tarihi",
  "Cinsiyet",
  "Kan Grubu",
  "Kimlik Numarası",
  "Eposta",
  "Cep Telefonu",
  "Sabit Telefon",
  "Yurtdışı Telefon",
  "Ülke",
  "Şehir",
  "İlçe",
  "Mahalle",
  "Adres",
  "IBAN",
];

const csvHeadersEn = [
  "Name",
  "Surname",
  "Nationality",
  "BirthDate",
  "Gender",
  "Blood",
  "Identity",
  "Mail",
  "GSM",
  "Phone",
  "AbroadPhone",
  "Country",
  "City",
  "Town",
  "District",
  "Address",
  "IBAN",
];

const dbFields = [
  "ad",
  "soyad",
  "uyruk",
  "dogum_tarihi",
  "cinsiyet",
  "kan_grubu",
  "kimlik_no",
  "eposta",
  "cep_telefonu",
  "sabit_telefon",
  "yurtdisi_telefon",
  "ulke",
  "sehir",
  "ilce",
  "mahalle",
  "adres",
  "iban",
] as const;

type DbField = (typeof dbFields)[number];

type Mapping = Record<DbField, string | null>; // db alanı -> csv header adı

const defaultMappingFromHeaders = (headers: string[]): Mapping => {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[ıİ]/g, "i")
      .replace(/[şŞ]/g, "s")
      .replace(/[ğĞ]/g, "g")
      .replace(/[üÜ]/g, "u")
      .replace(/[öÖ]/g, "o")
      .replace(/[çÇ]/g, "c");

  const map: Partial<Mapping> = {};
  const hset = new Set(headers);

  const find = (candidates: string[]) => {
    for (const c of candidates) {
      if (hset.has(c)) return c;
    }
    // fuzzy
    const normHeaders = headers.map((h) => ({ h, n: normalize(h) }));
    for (const c of candidates) {
      const cn = normalize(c);
      const found = normHeaders.find((x) => x.n === cn);
      if (found) return found.h;
    }
    return null;
  };

  (map as Mapping).ad = find(["Ad", "Name"]);
  (map as Mapping).soyad = find(["Soyad", "Surname"]);
  (map as Mapping).uyruk = find(["Uyruk", "Nationality"]);
  (map as Mapping).dogum_tarihi = find(["Doğum Tarihi", "BirthDate"]);
  (map as Mapping).cinsiyet = find(["Cinsiyet", "Gender"]);
  (map as Mapping).kan_grubu = find(["Kan Grubu", "Blood"]);
  (map as Mapping).kimlik_no = find(["Kimlik Numarası", "Identity"]);
  (map as Mapping).eposta = find(["Eposta", "Mail", "E-mail", "Email"]);
  (map as Mapping).cep_telefonu = find(["Cep Telefonu", "GSM", "Mobile"]);
  (map as Mapping).sabit_telefon = find(["Sabit Telefon", "Phone"]);
  (map as Mapping).yurtdisi_telefon = find(["Yurtdışı Telefon", "AbroadPhone"]);
  (map as Mapping).ulke = find(["Ülke", "Country"]);
  (map as Mapping).sehir = find(["Şehir", "City"]);
  (map as Mapping).ilce = find(["İlçe", "Town", "District"]);
  (map as Mapping).mahalle = find(["Mahalle"]);
  (map as Mapping).adres = find(["Adres", "Address"]);
  (map as Mapping).iban = find(["IBAN"]);

  return map as Mapping;
};

function parseDateToISO(input: string | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  // Try ISO already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD.MM.YYYY
  const dmY = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  const m1 = s.match(dmY);
  if (m1) {
    const d = m1[1].padStart(2, "0");
    const m = m1[2].padStart(2, "0");
    const y = m1[3];
    return `${y}-${m}-${d}`;
  }

  // MM/DD/YYYY
  const mdY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const m2 = s.match(mdY);
  if (m2) {
    const m = m2[1].padStart(2, "0");
    const d = m2[2].padStart(2, "0");
    const y = m2[3];
    return `${y}-${m}-${d}`;
  }

  // Fallback: try Date.parse
  const t = Date.parse(s);
  if (!isNaN(t)) {
    const dt = new Date(t);
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

async function insertChunk(rows: MappedRow[]) {
  if (rows.length === 0) return { count: 0, error: null as any };
  const { data, error, count } = await supabase
    .from("ihtiyac_sahipleri")
    .insert(rows, { count: "exact" });
  return { data, error, count };
}

const CHUNK_SIZE = 500;

export default function TopluVeriYukleme() {
  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState<"auto" | ";" | ",">("auto");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Mapping>(() => defaultMappingFromHeaders([]));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ index: number; message: string }[]>([]);

  const addLog = (m: string) => setLog((prev) => [...prev, m]);

  const handleFile = (f: File) => {
    setFile(f);
    setHeaders([]);
    setRows([]);
    setMapping(defaultMappingFromHeaders([]));
    setErrors([]);
    setProgress(0);

    Papa.parse<Row>(f, {
      header: true,
      delimiter: delimiter === "auto" ? undefined : delimiter,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const parsedRows = (result.data || []).filter((r) => {
          // tüm kolonları boş olan satırları at
          return Object.values(r).some((v) => (v ?? "").toString().trim() !== "");
        });
        const hdrs = result.meta.fields || [];
        setHeaders(hdrs);
        setRows(parsedRows);
        setMapping(defaultMappingFromHeaders(hdrs));
        addLog(`CSV yüklendi. ${parsedRows.length} satır, ${hdrs.length} kolon.`);
      },
      error: (err) => {
        addLog(`CSV parse hatası: ${err.message}`);
      },
    });
  };

  const headerOptions = useMemo(() => headers, [headers]);

  const onChangeMap = (dbField: DbField, header: string | null) => {
    setMapping((m) => ({ ...m, [dbField]: header }));
  };

  const buildRow = (r: Row): MappedRow => {
    const get = (key: string | null | undefined) => {
      if (!key) return null;
      const v = r[key];
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      return s.length ? s : null;
    };

    const out: MappedRow = {
      ad: get(mapping.ad),
      soyad: get(mapping.soyad),
      uyruk: get(mapping.uyruk),
      dogum_tarihi: parseDateToISO(get(mapping.dogum_tarihi) || undefined),
      cinsiyet: get(mapping.cinsiyet),
      kan_grubu: get(mapping.kan_grubu),
      kimlik_no: get(mapping.kimlik_no),
      eposta: get(mapping.eposta),
      cep_telefonu: get(mapping.cep_telefonu),
      sabit_telefon: get(mapping.sabit_telefon),
      yurtdisi_telefon: get(mapping.yurtdisi_telefon),
      ulke: get(mapping.ulke),
      sehir: get(mapping.sehir),
      ilce: get(mapping.ilce),
      mahalle: get(mapping.mahalle),
      adres: get(mapping.adres),
      iban: get(mapping.iban),
    };

    return out;
  };

  const validateRow = (row: MappedRow, index: number) => {
    // Örnek basit validasyonlar:
    // ad veya soyad yoksa uyarı (zorunlu yapmak isterseniz burada hata döndürebilirsiniz)
    if (!row.ad && !row.soyad) {
      return { ok: false, message: `Satır ${index + 1}: ad/soyad boş.` };
    }
    // eposta çok basit kontrol
    if (row.eposta && !row.eposta.includes("@")) {
      return { ok: false, message: `Satır ${index + 1}: eposta geçersiz.` };
    }
    return { ok: true };
  };

  const handleUpload = async () => {
    if (!rows.length) {
      addLog("Yüklenecek satır yok.");
      return;
    }
    setLoading(true);
    setProgress(0);
    setErrors([]);
    addLog("Yükleme başladı...");

    try {
      // Map + validate
      const mapped: MappedRow[] = [];
      const localErrors: { index: number; message: string }[] = [];
      rows.forEach((r, i) => {
        const m = buildRow(r);
        const v = validateRow(m, i);
        if (v.ok) mapped.push(m);
        else localErrors.push({ index: i, message: v.message });
      });

      if (localErrors.length) {
        addLog(`${localErrors.length} satır doğrulamadan geçemedi. Başarılı olanlar yüklenecek.`);
        setErrors(localErrors);
      }

      // Chunk insert
      let inserted = 0;
      for (let i = 0; i < mapped.length; i += CHUNK_SIZE) {
        const chunk = mapped.slice(i, i + CHUNK_SIZE);
        const { error, count } = await insertChunk(chunk);
        if (error) {
          addLog(`Insert hatası (chunk ${i / CHUNK_SIZE + 1}): ${error.message}`);
          // Hata olursa chunk'ı tek tek deneyip loglamak isterseniz burada tekil deneme yapabilirsiniz.
        } else {
          inserted += count || chunk.length;
          setProgress(Math.round(((i + chunk.length) / mapped.length) * 100));
          addLog(`Chunk ${i / CHUNK_SIZE + 1}: ${count ?? chunk.length} kayıt eklendi.`);
        }
      }

      addLog(`Yükleme tamamlandı. Toplam eklenen kayıt: ${inserted}.`);
    } catch (e: any) {
      addLog(`Beklenmeyen hata: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Toplu Veri Yükleme (ihtiyac_sahipleri)</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">CSV Dosyası</label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ayracı</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value as any)}
          >
            <option value="auto">Otomatik</option>
            <option value=";">Noktalı virgül ;</option>
            <option value=",">Virgül ,</option>
          </select>
          <button
            className="border rounded px-3 py-1 text-sm"
            onClick={() => {
              if (file) handleFile(file);
            }}
          >
            Yeniden Parse
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Not: Dosyanız ; ile ayrılmış olabilir. Gerekirse ayracı değiştirip yeniden parse edin.
        </p>
      </div>

      {headers.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium">Kolon Eşleme</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dbFields.map((f) => (
              <div key={f} className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">{f}</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={mapping[f] ?? ""}
                  onChange={(e) => onChangeMap(f, e.target.value || null)}
                >
                  <option value="">(Eşleme yok)</option>
                  {headerOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            CSV başlıklarınız Türkçe (Ad, Soyad, ...) veya İngilizce (Name, Surname, ...) olabilir. Otomatik eşleme yapıldı, gerekirse düzenleyin.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          disabled={loading || rows.length === 0}
          className="border rounded px-4 py-2 text-sm disabled:opacity-50"
          onClick={handleUpload}
        >
          Yüklemeyi Başlat
        </button>
        {loading && (
          <div className="text-sm text-gray-700">Yükleniyor... % {progress}</div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="border rounded p-3 text-sm">
          <div className="font-medium mb-2">Doğrulama Hataları ({errors.length})</div>
          <ul className="list-disc pl-5 space-y-1 max-h-48 overflow-auto">
            {errors.slice(0, 200).map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
          </ul>
          {errors.length > 200 && (
            <div className="text-xs text-gray-500 mt-1">İlk 200 hata gösterildi.</div>
          )}
        </div>
      )}

      <div className="border rounded p-3 text-xs text-gray-800 max-h-64 overflow-auto whitespace-pre-wrap">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        İpucu: Çok fazla boş/ekstra sütun içeren CSV'lerde yalnızca seçtiğiniz başlıklar aktarılır. Diğer tüm sütunlar yok sayılır.
      </div>
    </div>
  );
}
