const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://qjxyxzqxqzqxqzqxqzqx.supabase.co', 'dummy-key');
supabase.storage.from('bucket').upload('file.txt', 'hello').then(res => console.log(JSON.stringify(res))).catch(err => console.log('ERROR:', err));
