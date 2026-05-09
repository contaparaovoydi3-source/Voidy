
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybidhcexdomfolnhizpo.supabase.co';
const supabaseAnonKey = 'sb_publishable_V_MnVcykYTheV73nU2z4Zw_TPa3y7Iq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
