import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nelpccazznqwnbdinovk.supabase.co';
// Note: This should be your anon/public key from Supabase dashboard
const supabaseAnonKey = 'sb_publishable_n3iGMRTE_r7e38YnUr1R6g_GrKniZQJ';

// Create client with error handling
let supabase: any;
try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
    console.error('Supabase initialization error:', error);
    // Create a mock client that won't break the app
    supabase = {
        auth: {
            signInWithOtp: async () => ({ error: new Error('Supabase not configured') }),
        },
        storage: {
            from: () => ({
                upload: async () => ({ error: new Error('Supabase not configured') }),
                getPublicUrl: () => ({ data: { publicUrl: '' } }),
            }),
        },
    };
}

export { supabase };
