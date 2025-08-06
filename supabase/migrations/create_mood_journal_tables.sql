-- Create mood_entries table
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion VARCHAR(50) NOT NULL CHECK (emotion IN ('happy', 'sad', 'anxious', 'calm', 'excited', 'angry', 'peaceful', 'stressed', 'grateful', 'lonely')),
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
  notes TEXT,
  photo_url TEXT,
  voice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for mood_entries
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at DESC);
CREATE INDEX idx_mood_entries_emotion ON mood_entries(emotion);

-- Row Level Security for mood_entries
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood entries" ON mood_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries" ON mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries" ON mood_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries" ON mood_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions for mood_entries
GRANT SELECT ON mood_entries TO anon;
GRANT ALL PRIVILEGES ON mood_entries TO authenticated;

-- Create entry_tags table
CREATE TABLE entry_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES mood_entries(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for entry_tags
CREATE INDEX idx_entry_tags_entry_id ON entry_tags(entry_id);
CREATE INDEX idx_entry_tags_name ON entry_tags(tag_name);

-- Row Level Security for entry_tags
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tags for own entries" ON entry_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mood_entries 
      WHERE mood_entries.id = entry_tags.entry_id 
      AND mood_entries.user_id = auth.uid()
    )
  );

-- Grant permissions for entry_tags
GRANT SELECT ON entry_tags TO anon;
GRANT ALL PRIVILEGES ON entry_tags TO authenticated;

-- Create media_files table
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES mood_entries(id) ON DELETE CASCADE,
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('photo', 'voice')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for media_files
CREATE INDEX idx_media_files_entry_id ON media_files(entry_id);
CREATE INDEX idx_media_files_type ON media_files(file_type);

-- Row Level Security for media_files
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage media for own entries" ON media_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mood_entries 
      WHERE mood_entries.id = media_files.entry_id 
      AND mood_entries.user_id = auth.uid()
    )
  );

-- Grant permissions for media_files
GRANT SELECT ON media_files TO anon;
GRANT ALL PRIVILEGES ON media_files TO authenticated;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('mood-photos', 'mood-photos', false),
  ('voice-recordings', 'voice-recordings', false);

-- Storage policies for mood-photos
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'mood-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'mood-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for voice-recordings
CREATE POLICY "Users can upload own voice recordings" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-recordings' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own voice recordings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-recordings' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );