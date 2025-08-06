import { createClient } from '@supabase/supabase-js'

// Düzeltilmiş Supabase kodu:
const supabase = createClient(
  'https://hcxstnzdbdeaazyjvroe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeHN0bnpkYmRlYWF6eWp2cm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDcxNTUsImV4cCI6MjA2OTk4MzE1NX0.lDrLQKfoR85wjJAJ_e3SFeyOb-gBn6iNBYJoLk7pOec'
)

// Kullanım örneği:
const { data, error } = await supabase
  .from('todos')
  .select()

if (error) {
  console.error('Error:', error)
} else {
  console.log('Data:', data)
}

// Hatalar:
// 1. URL'de fazla virgül vardı: `https://hcxstnzdbdeaazyjvroe.supabase.co,` -> `https://hcxstnzdbdeaazyjvroe.supabase.co`
// 2. API key tırnak içinde değildi: eyJhbGciOiJIUzI1NiIs... -> 'eyJhbGciOiJIUzI1NiIs...'
// 3. createClient fonksiyonunda parametreler doğru şekilde ayrılmamıştı