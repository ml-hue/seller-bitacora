import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqvrhhcgowywzrlrvyof.supabase.co';
const supabaseAnonKey = 'sb_publishable_d1ToNjyenC8KCno2gCcdrQ_Ht5-Y4yp';

export const sb = createClient(supabaseUrl, supabaseAnonKey);