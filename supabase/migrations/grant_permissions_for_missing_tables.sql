-- Grant permissions for missing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON odemeler TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ayni_yardim_islemleri TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON depo_urunleri TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vefa_destek TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hizmetler TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hastane_sevkler TO authenticated;

GRANT SELECT ON odemeler TO anon;
GRANT SELECT ON ayni_yardim_islemleri TO anon;
GRANT SELECT ON depo_urunleri TO anon;
GRANT SELECT ON vefa_destek TO anon;
GRANT SELECT ON hizmetler TO anon;
GRANT SELECT ON hastane_sevkler TO anon;