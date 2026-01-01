import { createClient } from '@supabase/supabase-js';

// NOT: Bu değerleri .env dosyasından veya doğrudan buraya yazarak güncellemelisin.
// Gerçek bir projede process.env.REACT_APP_SUPABASE_URL vb. kullanılmalı.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);